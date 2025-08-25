#!/usr/bin/env python3
"""
Archon MCP Server (stdio transport)
Compatible with Claude Code and other MCP clients.

This server acts as a bridge between Claude Code and the Archon HTTP API.
"""

import json
import logging
import asyncio
import httpx
from typing import Optional, Dict, Any, List
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server with stdio transport
mcp = FastMCP("archon-stdio", log_level="INFO")

# Archon API configuration
ARCHON_API_BASE = "http://localhost:4001/api"

# HTTP client for API calls
http_client: Optional[httpx.AsyncClient] = None

async def get_http_client() -> httpx.AsyncClient:
    """Get or create HTTP client for API calls."""
    global http_client
    if http_client is None:
        http_client = httpx.AsyncClient(timeout=30.0)
    return http_client

@mcp.tool()
async def perform_rag_query(
    query: str,
    match_count: int = 5,
    use_reranking: bool = True
) -> str:
    """
    Perform a RAG (Retrieval-Augmented Generation) query against the Archon knowledge base.
    
    Args:
        query: The search query to find relevant information
        match_count: Number of results to return (default: 5)
        use_reranking: Whether to use AI reranking for better results (default: True)
    
    Returns:
        Formatted search results with relevant context
    """
    try:
        client = await get_http_client()
        
        response = await client.post(
            f"{ARCHON_API_BASE}/knowledge/search",
            json={
                "query": query,
                "match_count": match_count,
                "use_reranking": use_reranking
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            
            if not results:
                return f"No results found for query: {query}"
            
            # Format results
            formatted_results = [f"# RAG Query Results for: {query}\n"]
            
            for i, result in enumerate(results, 1):
                content = result.get("content", "")
                source = result.get("source", {})
                title = source.get("title", "Unknown Source")
                url = source.get("url", "")
                
                formatted_results.append(f"## Result {i}: {title}")
                if url:
                    formatted_results.append(f"**Source:** {url}")
                formatted_results.append(f"**Content:**\n{content}\n")
            
            return "\n".join(formatted_results)
        else:
            return f"Error performing RAG query: HTTP {response.status_code}"
            
    except Exception as e:
        return f"Error performing RAG query: {str(e)}"

@mcp.tool()
async def search_code_examples(
    query: str,
    match_count: int = 3
) -> str:
    """
    Search for code examples in the Archon knowledge base.
    
    Args:
        query: The search query to find relevant code examples
        match_count: Number of code examples to return (default: 3)
    
    Returns:
        Formatted code examples with context
    """
    try:
        client = await get_http_client()
        
        response = await client.post(
            f"{ARCHON_API_BASE}/knowledge/search-code",
            json={
                "query": query,
                "match_count": match_count
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            
            if not results:
                return f"No code examples found for query: {query}"
            
            # Format code results
            formatted_results = [f"# Code Examples for: {query}\n"]
            
            for i, result in enumerate(results, 1):
                content = result.get("content", "")
                source = result.get("source", {})
                title = source.get("title", "Unknown Source")
                
                formatted_results.append(f"## Example {i}: {title}")
                formatted_results.append(f"```\n{content}\n```\n")
            
            return "\n".join(formatted_results)
        else:
            return f"Error searching code examples: HTTP {response.status_code}"
            
    except Exception as e:
        return f"Error searching code examples: {str(e)}"

@mcp.tool()
async def get_available_sources() -> str:
    """
    Get list of available knowledge sources in Archon.
    
    Returns:
        List of available sources with their details
    """
    try:
        client = await get_http_client()
        
        response = await client.get(
            f"{ARCHON_API_BASE}/knowledge/sources",
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            sources = data.get("sources", [])
            
            if not sources:
                return "No knowledge sources available in Archon."
            
            # Format sources
            formatted_sources = ["# Available Knowledge Sources\n"]
            
            for source in sources:
                title = source.get("title", "Unknown")
                url = source.get("url", "N/A")
                source_type = source.get("type", "unknown")
                documents_count = source.get("documents_count", 0)
                
                formatted_sources.append(f"## {title}")
                formatted_sources.append(f"- **Type:** {source_type}")
                formatted_sources.append(f"- **URL:** {url}")
                formatted_sources.append(f"- **Documents:** {documents_count}")
                formatted_sources.append("")
            
            return "\n".join(formatted_sources)
        else:
            return f"Error getting sources: HTTP {response.status_code}"
            
    except Exception as e:
        return f"Error getting sources: {str(e)}"

@mcp.tool()
async def archon_health_check() -> str:
    """
    Check if Archon services are running and healthy.
    
    Returns:
        Health status of Archon services
    """
    try:
        client = await get_http_client()
        
        response = await client.get(
            f"{ARCHON_API_BASE}/health",
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            return f"✅ Archon is healthy: {json.dumps(data, indent=2)}"
        else:
            return f"❌ Archon health check failed: HTTP {response.status_code}"
            
    except Exception as e:
        return f"❌ Archon health check failed: {str(e)}"

async def cleanup():
    """Cleanup resources on shutdown."""
    global http_client
    if http_client:
        await http_client.aclose()
        http_client = None

if __name__ == "__main__":
    try:
        # Run MCP server with stdio transport (Claude Code compatible)
        mcp.run(transport="stdio")
    except KeyboardInterrupt:
        pass
    finally:
        # Cleanup
        if http_client:
            asyncio.run(cleanup())