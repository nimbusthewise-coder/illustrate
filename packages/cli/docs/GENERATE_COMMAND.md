# Generate Command (F061)

Generate flow diagrams from natural language prompts using AI.

## Quick Start

```bash
# Basic generation
illustrate generate "user login flow"

# Save to file
illustrate generate "checkout process" --out checkout.illustrate

# Interactive mode
illustrate generate --interactive
```

## Usage

```bash
illustrate generate [prompt] [options]
```

### Arguments

- `[prompt]` - Natural language description of the flow diagram (optional if using `--interactive`)

### Options

#### Design & Canvas
- `--design-system <name>` - Design system to use (default: standard)
- `-w, --width <number>` - Canvas width in characters (default: 80)
- `-h, --height <number>` - Canvas height in characters (default: 40)
- `-t, --title <title>` - Custom diagram title

#### Output
- `-o, --out <file>` - Save to file
- `--format <format>` - Output format: `illustrate`, `ascii`, or `markdown` (default: illustrate)
- `--no-display` - Don't display in terminal (save to file only)

#### Display
- `--no-color` - Disable ANSI colors in terminal output
- `--no-border` - Disable border in terminal output

#### Mode
- `-i, --interactive` - Interactive mode with prompt refinement
- `-q, --quiet` - Suppress non-error output
- `-v, --verbose` - Show detailed progress and metadata

## Examples

### Basic Generation

Generate and display a login flow:
```bash
illustrate generate "user login flow with email and password"
```

### Design Systems

Use a specific design system:
```bash
illustrate generate "checkout process" --design-system mondrian
```

Available design systems:
- `standard` - Clean, modern, neutral (default)
- `dieter` - Braun-inspired, restrained
- `warhol` - Pop Art, bold & electric
- `moebius` - Ethereal sci-fi
- `peanuts` - Friendly, nostalgic
- `bass` - Cinematic, dramatic
- `albers` - Bauhaus color theory
- `mondrian` - De Stijl, primary colors
- `ghibli` - Magical naturalism
- `kare` - Classic Mac, retro
- `klein` - IKB, monochrome intensity
- `morris` - Arts & Crafts, artisanal
- `vignelli` - Modernist systems
- `hockney` - California pools & sunshine

### Save to File

Save as .illustrate file:
```bash
illustrate generate "user registration" --out registration.illustrate
```

Save as ASCII text:
```bash
illustrate generate "api workflow" --out api.txt --format ascii
```

Save as markdown:
```bash
illustrate generate "data pipeline" --out pipeline.md --format markdown
```

### Interactive Mode

Start in interactive mode for prompt refinement:
```bash
illustrate generate --interactive
```

Start with an initial prompt, then refine:
```bash
illustrate generate "dashboard layout" --interactive
```

### Custom Dimensions

Generate a larger diagram:
```bash
illustrate generate "system architecture" --width 120 --height 60
```

### Custom Title

Set a custom title:
```bash
illustrate generate "login flow" --title "User Authentication Flow"
```

### Quiet/Verbose Modes

Quiet mode (errors only):
```bash
illustrate generate "test flow" --out test.illustrate --quiet
```

Verbose mode (detailed progress):
```bash
illustrate generate "complex workflow" --verbose
```

## Output Formats

### .illustrate (JSON)
The native format includes full diagram data with metadata:
```json
{
  "version": 1,
  "title": "Generated: user login flow",
  "width": 80,
  "height": 40,
  "layers": [...],
  "components": [...],
  "metadata": {
    "designSystem": "standard",
    "generator": "illustrate-ai-v1",
    ...
  }
}
```

### ASCII (.txt)
Plain text export of the diagram:
```
┌─────────────────────────────────────┐
│ ILLUSTRATE.MD - AI GENERATION       │
├─────────────────────────────────────┤
│                                     │
│ This is a placeholder...            │
└─────────────────────────────────────┘
```

### Markdown (.md)
Markdown file with code block:
````markdown
# Generated: user login flow

Generated from prompt: "user login flow"

```ascii
┌─────────────────────────────────────┐
│ ILLUSTRATE.MD - AI GENERATION       │
└─────────────────────────────────────┘
```
````

## Workflow

### Interactive Refinement
The interactive mode allows you to refine your prompt:

1. Enter initial prompt (or start blank)
2. Review the prompt
3. Choose to refine or generate
4. If refining, enter new prompt
5. Repeat until satisfied
6. Generate diagram

### Progress Stages

During generation, you'll see progress through these stages:
1. **Analyzing** - Understanding the prompt
2. **Planning** - Planning the layout
3. **Generating** - Creating the diagram
4. **Refining** - Adding details
5. **Complete** - Finished

## Error Handling

The command provides helpful error messages:

```bash
# Empty prompt
❌ Invalid prompt: Prompt cannot be empty

# Too short
❌ Invalid prompt: Prompt is too short. Please provide more detail

# Too long
❌ Invalid prompt: Prompt is too long. Keep it under 1000 characters
```

## Tips

### File Naming
If you don't specify `--out`, the command suggests a filename:
```
💡 Tip: Save to a file with --out user-login-flow.illustrate
```

### Design System Selection
Choose a design system that matches your use case:
- **Enterprise apps:** standard, vignelli
- **Creative tools:** warhol, bass
- **Developer tools:** kare, dieter
- **Consumer apps:** peanuts, hockney
- **Design systems:** mondrian, albers

### Scripting
For scripts and automation, use quiet mode:
```bash
illustrate generate "diagram" --out output.illustrate --quiet
echo $? # Check exit code: 0 = success, 1 = error
```

## Phase 6 Integration

**Current Status:** This command is fully implemented with a placeholder generation service. When Phase 6 (AI Generation) is complete, it will:

1. Connect to real AI service (OpenAI/Anthropic)
2. Generate actual flow diagrams from prompts
3. Use design system components and styles
4. Provide intelligent layout and spacing
5. Support iterative refinement (F027)

The CLI interface will remain the same - no changes needed to your commands or scripts.

## Related Features

- **F026** - Prompt-to-Flow Generation (core AI service)
- **F027** - Iterative Refinement via Follow-up Prompts
- **F054** - Render in Terminal (used for display)
- **F041** - Plain ASCII Export (used for .txt format)
- **F028** - LLM-Readable Export Format (used by AI service)

## See Also

- [CLI README](../README.md) - Full CLI documentation
- [PRD.md](../../../PRD.md) - Product requirements (§6.5 AI Generation)
- [Design System](../../../DESIGN_SYSTEM.md) - Theme reference

## Support

For issues or questions:
1. Check error messages for hints
2. Try `--verbose` for detailed output
3. See PRD.md for feature specifications
4. File an issue if you find a bug
