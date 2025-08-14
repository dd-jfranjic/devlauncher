# 🧠 Archon AI Command Center - Dev Launcher Implementation Plan

## 📋 Project Overview

**Goal**: Integrate Archon (AI Command Center) into Dev Launcher as a hybrid system providing both global and per-project AI assistance capabilities.

**Repository**: https://github.com/coleam00/Archon  
**Integration Type**: Hybrid (Global + Per-Project Optional)  
**Timeline**: 2-3 weeks (3 phases)

---

## 🏗️ Architecture Overview

```
Dev Launcher
├── 🌍 Global Archon (System Service)
│   ├── Always running on dedicated ports
│   ├── Cross-project knowledge base
│   ├── Shared MCP server integration
│   └── Accessible from TopBar
│
├── 🎯 Per-Project Archon (Optional)
│   ├── Project-specific knowledge isolation
│   ├── Independent configuration
│   ├── Dedicated ports per project
│   └── Enabled via project settings
│
└── 🔧 Smart Integration
    ├── MCP auto-routing (global vs local)
    ├── UI context switching
    └── Resource management
```

---

## 📊 Technical Analysis

### **Archon Services:**
1. **archon-server** (FastAPI + SocketIO) - Port 8181
2. **archon-mcp** (MCP Protocol) - Port 8051  
3. **archon-agents** (PydanticAI) - Port 8052
4. **archon-ui** (React + Vite) - Port 3737

### **Resource Requirements:**
- **Global Instance**: 4 containers, ~512MB RAM, 4 ports
- **Per-Project**: 4 × N containers (N = projects with Archon enabled)
- **External Dependencies**: Supabase account, API keys (OpenAI/Gemini)

---

## 🎯 Implementation Phases

## 📅 **Phase 1: Global Archon Foundation (Week 1)**

### **1.1 System Service Architecture**
- [ ] Create `ArchonService` class in `server/src/services/`
- [ ] Add global Archon management endpoints
- [ ] Implement system-wide port allocation (4000-4003 range)
- [ ] Create Archon health monitoring

### **1.2 Database Schema Updates**
```sql
-- Add to schema.prisma
model SystemService {
  id          String   @id @default(cuid())
  name        String   @unique
  type        String   // 'archon-global'
  status      String   // 'running', 'stopped', 'error'
  ports       Json     // { ui: 4000, server: 4001, mcp: 4002, agents: 4003 }
  config      Json     // Supabase credentials, API keys
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### **1.3 Global Docker Configuration**
- [ ] Create `docker-compose.archon-global.yml`
- [ ] Environment variable management for global instance
- [ ] Volume mapping for persistent knowledge base
- [ ] Network integration with existing Dev Launcher services

### **1.4 Backend API Implementation**
```typescript
// New endpoints in server/src/api/system.ts
POST   /api/system/archon/start     // Start global Archon
POST   /api/system/archon/stop      // Stop global Archon
GET    /api/system/archon/status    // Get status
POST   /api/system/archon/config    // Update configuration
GET    /api/system/archon/logs      // Stream logs
```

### **Deliverables:**
✅ Global Archon can be started/stopped via API  
✅ Health monitoring and status reporting  
✅ Configuration management system  
✅ Docker orchestration for global instance  

---

## 🖥️ **Phase 2: UI Integration (Week 1-2)**

### **2.1 TopBar Integration**
```tsx
// client/src/components/TopBar.tsx additions
const ArchonButton = () => {
  return (
    <button
      onClick={openArchonWindow}
      className="btn-ghost btn-sm"
      title="Open Archon AI Assistant"
    >
      🧠 Archon
    </button>
  );
};
```

### **2.2 Archon Management Tab**
- [ ] Create `ArchonTab.tsx` component  
- [ ] Global Archon status display
- [ ] Configuration interface (Supabase, API keys)
- [ ] Logs streaming viewer
- [ ] Start/stop controls

### **2.3 System Settings Integration**
```tsx
// Add to SettingsTab.tsx
const ArchonSettings = () => {
  return (
    <Card title="Global Archon AI">
      <Toggle 
        label="Enable Global Archon"
        description="AI command center for all projects"
        value={archonEnabled}
        onChange={handleToggle}
      />
      <Input 
        label="Supabase URL"
        value={supabaseUrl}
        onChange={handleSupabaseUrl}
      />
      {/* API key management */}
    </Card>
  );
};
```

### **2.4 Quick Access Integration**
- [ ] Archon button in project overview
- [ ] Context-aware AI assistance
- [ ] Project knowledge integration

### **Deliverables:**
✅ Global Archon accessible from TopBar  
✅ Management interface for configuration  
✅ Real-time status monitoring UI  
✅ Integrated settings management  

---

## 🎯 **Phase 3: Per-Project Integration (Week 2-3)**

### **3.1 Project-Level Archon Support**

#### **Database Extensions:**
```sql
-- Add to Project model
model Project {
  // ... existing fields
  archonEnabled     Boolean @default(false)
  archonConfig      Json?   // Project-specific Archon config
  archonPorts       Json?   // Allocated ports for this project's Archon
}
```

#### **Template System Enhancement:**
- [ ] Add Archon as optional service in all templates
- [ ] Create Archon service definitions
- [ ] Port allocation integration

### **3.2 Project Archon Management**
```typescript
// New endpoints in server/src/api/projects.ts
POST   /api/projects/:slug/archon/enable   // Enable Archon for project
POST   /api/projects/:slug/archon/disable  // Disable Archon for project
POST   /api/projects/:slug/archon/start    // Start project Archon
POST   /api/projects/:slug/archon/stop     // Stop project Archon
GET    /api/projects/:slug/archon/status   // Get project Archon status
```

### **3.3 Smart MCP Integration**
```typescript
// Enhanced MCP routing logic
const getMCPServer = (projectSlug: string) => {
  const project = await getProject(projectSlug);
  
  if (project.archonEnabled && project.archonStatus === 'running') {
    // Use project-specific Archon MCP
    return `http://localhost:${project.archonPorts.mcp}`;
  }
  
  // Fallback to global Archon MCP
  return `http://localhost:4002`;
};
```

### **3.4 ProjectOverview Enhancement**
```tsx
// Add to ProjectOverview.tsx
const ArchonSection = ({ project }) => {
  if (!project.archonEnabled) {
    return (
      <Card>
        <h3>AI Assistant</h3>
        <Button onClick={enableProjectArchon}>
          Enable Project-Specific Archon
        </Button>
        <p>Currently using Global Archon</p>
      </Card>
    );
  }
  
  return (
    <Card>
      <h3>Project AI Assistant</h3>
      <div className="archon-status">
        Status: {project.archonStatus}
      </div>
      <div className="archon-actions">
        <Button onClick={openProjectArchon}>Open Archon UI</Button>
        <Button onClick={viewArchonLogs}>View Logs</Button>
      </div>
    </Card>
  );
};
```

### **Deliverables:**
✅ Per-project Archon enablement  
✅ Smart MCP server routing  
✅ Project-specific AI knowledge bases  
✅ Complete hybrid system implementation  

---

## 🔧 Implementation Details

### **Port Management Strategy**
```typescript
// Port allocation ranges
const ARCHON_PORT_RANGES = {
  global: {
    ui: 4000,
    server: 4001, 
    mcp: 4002,
    agents: 4003
  },
  project: {
    base: 4100, // Start from 4100 for projects
    increment: 10 // Each project gets 10 ports (4100-4109, 4110-4119, etc.)
  }
};

const allocateArchonPorts = (projectSlug: string) => {
  const projectIndex = getProjectIndex(projectSlug);
  const basePort = ARCHON_PORT_RANGES.project.base + (projectIndex * 10);
  
  return {
    ui: basePort,
    server: basePort + 1,
    mcp: basePort + 2,
    agents: basePort + 3
  };
};
```

### **Docker Compose Templates**

#### **Global Archon (docker-compose.archon-global.yml)**
```yaml
version: '3.8'
services:
  archon-global-server:
    build: 
      context: ./archon
      dockerfile: Dockerfile.server
    ports:
      - "4001:8181"
    environment:
      - SUPABASE_URL=${GLOBAL_ARCHON_SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${GLOBAL_ARCHON_SUPABASE_KEY}
    volumes:
      - archon-global-data:/app/data
    networks:
      - archon-global

  archon-global-mcp:
    build:
      context: ./archon
      dockerfile: Dockerfile.mcp
    ports:
      - "4002:8051"
    depends_on:
      - archon-global-server
    networks:
      - archon-global

  archon-global-agents:
    build:
      context: ./archon  
      dockerfile: Dockerfile.agents
    ports:
      - "4003:8052"
    environment:
      - OPENAI_API_KEY=${GLOBAL_ARCHON_OPENAI_KEY}
    depends_on:
      - archon-global-server
    networks:
      - archon-global

  archon-global-ui:
    build:
      context: ./archon
      dockerfile: Dockerfile.frontend
    ports:
      - "4000:3737"
    depends_on:
      - archon-global-server
    networks:
      - archon-global

volumes:
  archon-global-data:

networks:
  archon-global:
    driver: bridge
```

#### **Per-Project Archon Template**
```yaml
# Template to be injected into project docker-compose files
  archon-server:
    build: 
      context: ${DEV_LAUNCHER_ROOT}/archon
      dockerfile: Dockerfile.server
    ports:
      - "${ARCHON_SERVER_PORT}:8181"
    environment:
      - SUPABASE_URL=${ARCHON_SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${ARCHON_SUPABASE_KEY}
      - PROJECT_CONTEXT=${PROJECT_SLUG}
    volumes:
      - ./archon-data:/app/data
    networks:
      - ${PROJECT_SLUG}-network

  archon-mcp:
    build:
      context: ${DEV_LAUNCHER_ROOT}/archon
      dockerfile: Dockerfile.mcp  
    ports:
      - "${ARCHON_MCP_PORT}:8051"
    depends_on:
      - archon-server
    networks:
      - ${PROJECT_SLUG}-network

  archon-agents:
    build:
      context: ${DEV_LAUNCHER_ROOT}/archon
      dockerfile: Dockerfile.agents
    ports:
      - "${ARCHON_AGENTS_PORT}:8052"
    environment:
      - OPENAI_API_KEY=${ARCHON_OPENAI_KEY}
      - PROJECT_CONTEXT=${PROJECT_SLUG}
    depends_on:
      - archon-server
    networks:
      - ${PROJECT_SLUG}-network

  archon-ui:
    build:
      context: ${DEV_LAUNCHER_ROOT}/archon
      dockerfile: Dockerfile.frontend
    ports:
      - "${ARCHON_UI_PORT}:3737"
    depends_on:
      - archon-server
    networks:
      - ${PROJECT_SLUG}-network
```

### **Configuration Management**
```typescript
// server/src/services/archon-config.ts
interface ArchonConfig {
  global: {
    enabled: boolean;
    supabaseUrl: string;
    supabaseKey: string;
    openaiKey: string;
    geminiKey?: string;
    ports: ArchonPorts;
  };
  projects: Record<string, {
    enabled: boolean;
    config: ArchonConfig;
    ports: ArchonPorts;
  }>;
}

class ArchonConfigService {
  async getGlobalConfig(): Promise<ArchonConfig['global']> {
    // Load from database/env
  }
  
  async updateGlobalConfig(config: Partial<ArchonConfig['global']>): Promise<void> {
    // Save to database, restart services if needed
  }
  
  async enableProjectArchon(projectSlug: string): Promise<void> {
    // Allocate ports, create config, update docker-compose
  }
  
  async disableProjectArchon(projectSlug: string): Promise<void> {
    // Stop containers, deallocate ports, cleanup
  }
}
```

---

## 🚀 Setup & Installation Wizard

### **First-Time Setup Flow**
1. **Archon Detection**: Check if user wants to enable Archon
2. **Supabase Setup Guide**: Step-by-step Supabase account creation
3. **API Key Configuration**: OpenAI/Gemini key setup
4. **Database Initialization**: Run setup SQL scripts
5. **First Launch**: Start global Archon instance

### **Setup Wizard Component**
```tsx
// client/src/components/ArchonSetupWizard.tsx
const ArchonSetupWizard = () => {
  const [step, setStep] = useState(1);
  
  const steps = [
    { id: 1, title: "Welcome to Archon", component: <WelcomeStep /> },
    { id: 2, title: "Supabase Setup", component: <SupabaseStep /> },
    { id: 3, title: "AI API Keys", component: <APIKeysStep /> },
    { id: 4, title: "Database Setup", component: <DatabaseStep /> },
    { id: 5, title: "Launch Archon", component: <LaunchStep /> }
  ];
  
  return <WizardStepper steps={steps} currentStep={step} />;
};
```

---

## 📝 File Structure Changes

```
dev-launcher/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── archon.ts              # NEW: Archon orchestration service
│   │   │   ├── archon-config.ts       # NEW: Configuration management  
│   │   │   └── system-services.ts     # NEW: System service management
│   │   ├── api/
│   │   │   ├── system.ts              # UPDATED: Add Archon endpoints
│   │   │   └── projects.ts            # UPDATED: Add per-project Archon
│   │   └── prisma/
│   │       └── schema.prisma          # UPDATED: Add SystemService model
│   └── docker/
│       └── archon/                    # NEW: Archon Docker configs
│           ├── docker-compose.global.yml
│           └── Dockerfile.*
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TopBar.tsx             # UPDATED: Add Archon button
│   │   │   ├── ArchonTab.tsx          # NEW: Archon management interface
│   │   │   ├── ArchonSetupWizard.tsx  # NEW: Setup wizard
│   │   │   └── ProjectOverview.tsx    # UPDATED: Add Archon section
│   │   ├── services/
│   │   │   └── archon-api.ts          # NEW: Archon API client
│   │   └── stores/
│   │       └── archon-store.ts        # NEW: Archon state management
│
├── templates/
│   ├── wordpress/
│   │   ├── docker-compose.yml         # UPDATED: Add optional Archon services
│   │   └── manifest.yaml              # UPDATED: Add Archon variables
│   ├── nextjs/
│   │   ├── docker-compose.yml         # UPDATED: Add optional Archon services  
│   │   └── manifest.yaml              # UPDATED: Add Archon variables
│   └── archon/                        # NEW: Standalone Archon template
│       ├── docker-compose.yml
│       ├── manifest.yaml
│       └── README.md
│
├── archon/                            # NEW: Archon source code (Git submodule)
│   ├── server/
│   ├── mcp/
│   ├── agents/
│   ├── frontend/
│   └── docker-compose.yml
│
└── ARCHON_IMPLEMENTATION_PLAN.md      # THIS FILE
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- [ ] ArchonService class methods
- [ ] Port allocation logic
- [ ] Configuration management
- [ ] API endpoint responses

### **Integration Tests**
- [ ] Global Archon startup/shutdown
- [ ] Per-project Archon enablement
- [ ] MCP server routing
- [ ] Docker compose orchestration

### **End-to-End Tests**
- [ ] Complete setup wizard flow
- [ ] Global Archon → Project Archon switching
- [ ] AI assistant functionality
- [ ] Cross-project knowledge sharing

### **Performance Tests**
- [ ] Memory usage with multiple Archon instances
- [ ] Response times for AI queries
- [ ] Container startup times
- [ ] Resource cleanup verification

---

## 🔄 Migration & Updates

### **Archon Updates**
- Use Git submodule for Archon source code
- Automatic update checking
- Version compatibility matrix
- Rollback mechanism for failed updates

### **Configuration Migration**
- Database schema evolution
- Backwards compatibility for settings
- Automatic port reallocation if conflicts

---

## 🚨 Error Handling & Monitoring

### **Common Issues & Solutions**
1. **Supabase Connection Failed**
   - Validate credentials
   - Check network connectivity
   - Provide setup guidance

2. **Port Conflicts**
   - Automatic port reallocation
   - User notification of changes
   - Port availability checking

3. **AI API Rate Limits**
   - Request queuing
   - User notification
   - Graceful degradation

4. **Resource Exhaustion**
   - Memory monitoring
   - Automatic cleanup
   - User warnings

### **Monitoring Dashboard**
```tsx
const ArchonMonitoring = () => {
  return (
    <div className="monitoring-grid">
      <ResourceCard title="Memory Usage" value={memoryUsage} />
      <ResourceCard title="Active Instances" value={instanceCount} />
      <ResourceCard title="API Requests/min" value={apiRequestRate} />
      <ResourceCard title="Error Rate" value={errorRate} />
    </div>
  );
};
```

---

## 📈 Success Metrics

### **Phase 1 Success Criteria:**
- [ ] Global Archon can be started/stopped reliably
- [ ] Configuration persists across Dev Launcher restarts
- [ ] Health monitoring shows accurate status
- [ ] API endpoints respond within 500ms

### **Phase 2 Success Criteria:**
- [ ] UI is intuitive and responsive
- [ ] Setup wizard completes successfully >90% of time
- [ ] Users can access Archon from TopBar
- [ ] No UI performance degradation

### **Phase 3 Success Criteria:**
- [ ] Per-project Archon works in isolation
- [ ] MCP routing works seamlessly
- [ ] No port conflicts in normal usage
- [ ] Resource usage stays within reasonable bounds

### **Overall Success Metrics:**
- [ ] User adoption rate >60% within first month
- [ ] Average setup time <10 minutes
- [ ] Error rate <5% in production
- [ ] Positive user feedback score >4/5

---

## 🗓️ Detailed Timeline

### **Week 1: Foundation**
- **Day 1-2**: Database schema, ArchonService class
- **Day 3-4**: Global Docker configuration, API endpoints
- **Day 5-7**: TopBar integration, basic UI components

### **Week 2: Enhancement**
- **Day 1-3**: ArchonTab component, setup wizard
- **Day 4-5**: Per-project database extensions
- **Day 6-7**: Project Archon API endpoints

### **Week 3: Integration & Testing**
- **Day 1-3**: Smart MCP routing, ProjectOverview updates
- **Day 4-5**: End-to-end testing, bug fixes
- **Day 6-7**: Documentation, performance optimization

---

## 💰 Cost Considerations

### **User Costs:**
- **Supabase**: Free tier supports ~500MB DB, then $25/month Pro
- **OpenAI API**: ~$10-50/month depending on usage
- **Gemini API**: Often cheaper alternative to OpenAI

### **Development Resources:**
- **Implementation**: ~3 weeks (1 developer)
- **Testing**: ~1 week
- **Documentation**: ~2-3 days
- **Maintenance**: ~2-4 hours/month

### **Infrastructure:**
- **Additional Docker containers**: ~200-500MB RAM per Archon instance
- **Network overhead**: Minimal (localhost communication)
- **Storage**: ~50-100MB per project knowledge base

---

## 🎯 Future Enhancements

### **Phase 4: Advanced Features (Future)**
- [ ] **Multi-tenant Supabase**: Automatic project database separation
- [ ] **Custom AI Models**: Ollama integration for local AI
- [ ] **Knowledge Sync**: Share knowledge between global and project Archon
- [ ] **Team Collaboration**: Multi-user support within projects
- [ ] **Plugin System**: Custom Archon extensions
- [ ] **Performance Analytics**: AI usage tracking and optimization

### **Phase 5: Enterprise Features (Future)**
- [ ] **SSO Integration**: Enterprise authentication
- [ ] **Audit Logging**: Compliance and security tracking
- [ ] **Resource Quotas**: Limit AI usage per project/user
- [ ] **Custom Deployment**: On-premise Archon instances
- [ ] **API Gateway**: Central management of AI services

---

## 🚀 Getting Started

### **Prerequisites for Development:**
1. **Dev Launcher** development environment setup
2. **Docker Desktop** installed and running
3. **Node.js 18+** for frontend development
4. **Supabase account** for testing
5. **OpenAI API key** for testing

### **First Steps:**
1. Clone Archon repository as submodule
2. Update database schema with SystemService model
3. Implement basic ArchonService class
4. Create global Docker compose configuration
5. Add TopBar Archon button

### **Testing the Implementation:**
1. Start Dev Launcher in development mode
2. Enable global Archon in settings
3. Verify Archon UI loads on port 4000
4. Test project-specific Archon enablement
5. Validate MCP integration works correctly

---

## 📞 Support & Maintenance

### **Documentation Required:**
- [ ] User setup guide
- [ ] Developer API documentation
- [ ] Troubleshooting guide
- [ ] Configuration reference
- [ ] Update procedures

### **Community Integration:**
- [ ] GitHub issues for bug reports
- [ ] Discord channel for community support
- [ ] Regular updates and feature announcements
- [ ] User feedback collection system

---

## ✅ Conclusion

This implementation plan provides a comprehensive roadmap for integrating Archon into Dev Launcher as a hybrid AI assistant system. The phased approach ensures a stable, scalable solution that grows with user needs while maintaining the simplicity and efficiency that Dev Launcher users expect.

The combination of global and per-project Archon instances offers the best of both worlds: resource efficiency with the option for project isolation when needed. This approach positions Dev Launcher as a cutting-edge development platform that seamlessly integrates AI assistance into the developer workflow.

**Ready to revolutionize AI-assisted development! 🚀**