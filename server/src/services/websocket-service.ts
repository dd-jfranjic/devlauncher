import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createLogger } from '../utils/logger';
import { DockerService } from './docker-service';
import { spawn, ChildProcess } from 'child_process';
import { ProjectLocation } from '../domain/types';

const logger = createLogger('websocket');

interface LogStreamOptions {
  projectName: string;
  projectPath: string;
  location: ProjectLocation;
  service?: string;
}

interface TerminalSession {
  process: ChildProcess;
  projectSlug: string;
  sessionId: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private dockerService: DockerService;
  private activeStreams: Map<string, ChildProcess> = new Map();
  private terminalSessions: Map<string, TerminalSession> = new Map();

  constructor(server: HTTPServer) {
    this.dockerService = new DockerService();
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
        credentials: true
      },
      path: '/ws'
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info('WebSocket client connected', { id: socket.id });

      // Handle log streaming
      socket.on('stream:logs:start', async (options: LogStreamOptions) => {
        logger.info('Starting log stream', { socketId: socket.id, options });
        await this.startLogStream(socket, options);
      });

      socket.on('stream:logs:stop', (streamId: string) => {
        logger.info('Stopping log stream', { socketId: socket.id, streamId });
        this.stopLogStream(streamId);
      });

      // Handle terminal sessions
      socket.on('terminal:create', async (data: { projectSlug: string; location: ProjectLocation; path: string }) => {
        logger.info('Creating terminal session', { socketId: socket.id, data });
        await this.createTerminalSession(socket, data);
      });

      socket.on('terminal:input', (data: { sessionId: string; input: string }) => {
        this.handleTerminalInput(data.sessionId, data.input);
      });

      socket.on('terminal:resize', (data: { sessionId: string; cols: number; rows: number }) => {
        this.resizeTerminal(data.sessionId, data.cols, data.rows);
      });

      socket.on('terminal:destroy', (sessionId: string) => {
        logger.info('Destroying terminal session', { socketId: socket.id, sessionId });
        this.destroyTerminalSession(sessionId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('WebSocket client disconnected', { id: socket.id });
        
        // Clean up any active streams for this socket
        this.activeStreams.forEach((process, streamId) => {
          if (streamId.startsWith(socket.id)) {
            this.stopLogStream(streamId);
          }
        });

        // Clean up terminal sessions
        this.terminalSessions.forEach((session, sessionId) => {
          if (sessionId.startsWith(socket.id)) {
            this.destroyTerminalSession(sessionId);
          }
        });
      });
    });
  }

  private async startLogStream(socket: Socket, options: LogStreamOptions): Promise<void> {
    const streamId = `${socket.id}-${options.projectName}`;
    
    // Stop existing stream if any
    if (this.activeStreams.has(streamId)) {
      this.stopLogStream(streamId);
    }

    try {
      const args = ['compose', '-p', options.projectName, 'logs', '-f'];
      if (options.service) {
        args.push(options.service);
      }

      let command: string;
      let execOptions: any = {
        cwd: options.projectPath
      };

      if (options.location === 'wsl') {
        command = 'wsl.exe';
        args.unshift('-d', 'Ubuntu', '--', 'docker');
      } else {
        command = 'docker';
      }

      const logProcess = spawn(command, args, execOptions);
      this.activeStreams.set(streamId, logProcess);

      logProcess.stdout.on('data', (data: Buffer) => {
        socket.emit('stream:logs:data', {
          streamId,
          data: data.toString(),
          timestamp: new Date().toISOString()
        });
      });

      logProcess.stderr.on('data', (data: Buffer) => {
        socket.emit('stream:logs:error', {
          streamId,
          data: data.toString(),
          timestamp: new Date().toISOString()
        });
      });

      logProcess.on('close', (code: number) => {
        logger.info('Log stream closed', { streamId, code });
        this.activeStreams.delete(streamId);
        socket.emit('stream:logs:closed', { streamId, code });
      });

      socket.emit('stream:logs:started', { streamId });
    } catch (error) {
      logger.error('Failed to start log stream', { error, options });
      socket.emit('stream:logs:error', {
        streamId,
        error: error instanceof Error ? error.message : 'Failed to start log stream'
      });
    }
  }

  private stopLogStream(streamId: string): void {
    const process = this.activeStreams.get(streamId);
    if (process) {
      process.kill();
      this.activeStreams.delete(streamId);
      logger.info('Log stream stopped', { streamId });
    }
  }

  private async createTerminalSession(
    socket: Socket, 
    data: { projectSlug: string; location: ProjectLocation; path: string }
  ): Promise<void> {
    const sessionId = `${socket.id}-${data.projectSlug}-${Date.now()}`;
    
    try {
      let shell: string;
      let args: string[] = [];
      
      if (data.location === 'wsl') {
        shell = 'wsl.exe';
        args = ['-d', 'Ubuntu', '--cd', data.path];
      } else {
        shell = 'powershell.exe';
        args = ['-NoExit', '-Command', `cd "${data.path}"`];
      }

      const terminalProcess = spawn(shell, args, {
        env: { ...process.env, TERM: 'xterm-256color' },
        shell: false
      });

      const session: TerminalSession = {
        process: terminalProcess,
        projectSlug: data.projectSlug,
        sessionId
      };

      this.terminalSessions.set(sessionId, session);

      terminalProcess.stdout?.on('data', (data: Buffer) => {
        socket.emit('terminal:output', {
          sessionId,
          data: data.toString()
        });
      });

      terminalProcess.stderr?.on('data', (data: Buffer) => {
        socket.emit('terminal:output', {
          sessionId,
          data: data.toString(),
          isError: true
        });
      });

      terminalProcess.on('close', (code: number) => {
        logger.info('Terminal session closed', { sessionId, code });
        this.terminalSessions.delete(sessionId);
        socket.emit('terminal:closed', { sessionId, code });
      });

      socket.emit('terminal:created', { sessionId });
    } catch (error) {
      logger.error('Failed to create terminal session', { error, data });
      socket.emit('terminal:error', {
        error: error instanceof Error ? error.message : 'Failed to create terminal session'
      });
    }
  }

  private handleTerminalInput(sessionId: string, input: string): void {
    const session = this.terminalSessions.get(sessionId);
    if (session && session.process.stdin) {
      session.process.stdin.write(input);
    }
  }

  private resizeTerminal(sessionId: string, cols: number, rows: number): void {
    const session = this.terminalSessions.get(sessionId);
    if (session && session.process.stdin && 'setRawMode' in session.process.stdin) {
      // For proper terminal emulation, we'd need node-pty here
      // This is a simplified version
      logger.debug('Terminal resize requested', { sessionId, cols, rows });
    }
  }

  private destroyTerminalSession(sessionId: string): void {
    const session = this.terminalSessions.get(sessionId);
    if (session) {
      session.process.kill();
      this.terminalSessions.delete(sessionId);
      logger.info('Terminal session destroyed', { sessionId });
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}