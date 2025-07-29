#!/bin/bash
echo "🚀 Starting DevLauncher MCP stack..."

# Start Docker services
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Register MCP servers with Claude
echo "🔗 Registering MCP servers..."
while read -r server; do
  ID=$(echo $server | jq -r '.id')
  URL=$(echo $server | jq -r '.url')
  TRANSPORT=$(echo $server | jq -r '.transport')
  SCOPE=$(echo $server | jq -r '.scope')
  
  echo "  - Registering $ID..."
  npx @anthropic-ai/claude-code mcp add $ID --transport $TRANSPORT $URL -s $SCOPE
done < <(jq -c '.[]' servers.json)

echo "✅ MCP stack started successfully!"