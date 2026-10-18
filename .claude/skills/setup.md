Set up Claude Code for the homework

After doing the planning pipeline

install skills and agents


Install the four design skills

1. Open a terminal. Mac: the Terminal app. Linux: your terminal. Windows: the Ubuntu app (WSL). Don't use PowerShell, Command Prompt, or Git Bash.
2. Go to your project folder, the one you'll start Claude Code in: cd ~/my-project. The skills install into .claude/skills/ inside whatever folder you're in.
3. Paste this and press Enter:
   curl -fsSL https://kabeier.github.io/SPAs-and-Claude/lecture-2-building-spas/demo-kit/setup-skills.sh | bash
   It should finish with four ✓ lines, one per skill.
4. Check it: start claude in the same folder and type /skills. You should see all four. (Taste appears as design-taste-frontend, which is correct.)
5. Skills install gave an error, or no ✓ lines? Open the step-by-step manual install guide. It starts with a fix-it table for common errors.

Add the three MCP servers
In the same terminal (not inside Claude Code), paste these three lines:
claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest
claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp
claude mcp add --scope user chrome-devtools -- npx -y chrome-devtools-mcp@latest

--scope user means every project on your computer gets them. If one says it already exists (you added Playwright in an earlier lecture), that's fine.
Check them: claude mcp list should show all three as Connected. Inside Claude Code, /mcp shows the same.
