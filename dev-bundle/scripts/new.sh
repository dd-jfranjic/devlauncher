#!/bin/bash
# DevLauncher Quick Project Creator

PROJECT_NAME=$1
TYPE=${2:-wordpress}
PATH=${3:-~/dev}
NO_PRPS=${4:-false}
NO_MCP=${5:-false}

if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: ./new.sh <project-name> [type] [path] [no-prps] [no-mcp]"
    echo "Types: wordpress, static, ai-agent, node"
    exit 1
fi

echo "🚀 Creating new project: $PROJECT_NAME"

# Create project directory
PROJECT_PATH="$PATH/$PROJECT_NAME"
mkdir -p "$PROJECT_PATH"

# Copy template
TEMPLATE_PATH="../templates/$TYPE"
if [ -d "$TEMPLATE_PATH" ]; then
    cp -r "$TEMPLATE_PATH/"* "$PROJECT_PATH/"
fi

# Generate .env
if [ -f "$TEMPLATE_PATH/.env.template" ]; then
    sed "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" "$TEMPLATE_PATH/.env.template" > "$PROJECT_PATH/.env"
fi

echo "✅ Project created at: $PROJECT_PATH"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_PATH"
echo "  docker-compose up -d"
echo "  npx @anthropic-ai/claude-code"