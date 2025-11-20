# Claude Code Configuration

This directory contains configuration for Claude Code (Anthropic's CLI tool).

## Files

### settings.local.json
MCP (Model Context Protocol) permissions configuration for Claude Code.

**Allowed Permissions:**
- **Figma MCP**: Image and code extraction from Figma designs
- **File Operations**: ls, find, mkdir, grep
- **Build & Development**: npm run build, npm run dev, type-check
- **Docker**: docker, docker-compose commands
- **Git**: All git operations
- **Testing**: Playwright tests
- **Network**: curl commands

## Usage

These settings are automatically loaded by Claude Code when working in this project directory.

To modify permissions, edit `settings.local.json` and adjust the `allow` or `deny` arrays.

## Documentation

For more information about Claude Code and MCP:
- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [MCP Protocol](https://modelcontextprotocol.io)
