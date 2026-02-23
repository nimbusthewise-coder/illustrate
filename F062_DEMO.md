# F062 Demo: Export Command Usage

## Basic Usage

### 1. Export a Diagram

```bash
$ illustrate export doc-abc123

+---------------------+
|   User Login       |
+---------------------+
| [Username]         |
| [Password]         |
| [Login Button]     |
+---------------------+
```

### 2. Copy to Clipboard

**macOS:**
```bash
$ illustrate export doc-abc123 | pbcopy
# Diagram is now in clipboard, ready to paste
```

**Linux (X11):**
```bash
$ illustrate export doc-abc123 | xclip -selection clipboard
```

**Linux (Wayland):**
```bash
$ illustrate export doc-abc123 | wl-copy
```

### 3. Save to File

```bash
$ illustrate export doc-abc123 > flowchart.txt

$ cat flowchart.txt
+---------------------+
|   User Login       |
+---------------------+
```

### 4. Count Lines

```bash
$ illustrate export doc-abc123 | wc -l
5
```

### 5. Search Within Diagram

```bash
$ illustrate export doc-abc123 | grep "Login"
|   User Login       |
| [Login Button]     |
```

### 6. Compare Diagrams

```bash
$ diff <(illustrate export doc-v1) <(illustrate export doc-v2)
3c3
< | [Password]         |
---
> | [Email]            |
```

### 7. Include in Documentation

```bash
$ cat > README.md << 'EOF'
# Architecture

Our login flow:

$(illustrate export doc-abc123)

EOF
```

### 8. Email a Diagram

```bash
$ illustrate export doc-abc123 | mail -s "Flowchart for Review" team@example.com
```

### 9. Custom API Endpoint

```bash
$ illustrate export doc-abc123 --api-url https://illustrate.md
```

### 10. With Environment Variable

```bash
$ export ILLUSTRATE_API_URL=https://illustrate.md
$ illustrate export doc-abc123
```

## Advanced Pipelines

### Extract TODO Items

```bash
$ illustrate export doc-abc123 | grep -i "TODO"
│ TODO: Add validation │
│ TODO: Error handling │
```

### Word Count

```bash
$ illustrate export doc-abc123 | wc -w
42
```

### Convert Tabs to Spaces

```bash
$ illustrate export doc-abc123 | expand -t 4 > diagram.txt
```

### Strip All Whitespace

```bash
$ illustrate export doc-abc123 | tr -d ' ' | grep -v '^$'
```

### Add Line Numbers

```bash
$ illustrate export doc-abc123 | nl
     1  +---------------------+
     2  |   User Login       |
     3  +---------------------+
```

### Wrap in Code Block

```bash
$ echo '```ascii' > output.md
$ illustrate export doc-abc123 >> output.md
$ echo '```' >> output.md
```

### Append to Multiple Files

```bash
$ illustrate export doc-abc123 | tee diagram.txt | tee -a log.txt > /dev/null
```

## Error Handling

### Document Not Found

```bash
$ illustrate export nonexistent
Error: Document not found: nonexistent
# Exit code: 1
```

### API Connection Error

```bash
$ illustrate export doc-abc123 --api-url http://invalid-url
Error: API request failed: connect ECONNREFUSED
# Exit code: 1
```

### Inspect Exit Code

```bash
$ illustrate export doc-abc123
$ echo $?
0  # Success

$ illustrate export invalid-id
$ echo $?
1  # Error
```

## Scripting Examples

### Batch Export

```bash
#!/bin/bash
# Export all diagrams to files

for id in doc-001 doc-002 doc-003; do
  illustrate export "$id" > "diagrams/${id}.txt"
  echo "Exported $id"
done
```

### Conditional Export

```bash
#!/bin/bash
# Only export if diagram contains "API"

if illustrate export doc-abc123 | grep -q "API"; then
  illustrate export doc-abc123 > api-diagram.txt
  echo "API diagram exported"
fi
```

### Export with Timestamp

```bash
$ illustrate export doc-abc123 > "diagram-$(date +%Y%m%d-%H%M%S).txt"
```

## Integration Examples

### Git Commit Message

```bash
$ git commit -m "Add login flow

$(illustrate export doc-login | sed 's/^/  /')
"
```

### Slack/Chat

```bash
$ illustrate export doc-abc123 | xclip -selection clipboard
# Paste into Slack with Shift+Enter to preserve formatting
```

### Generate HTML

```bash
$ cat > diagram.html << EOF
<!DOCTYPE html>
<html>
<head><title>Diagram</title></head>
<body>
<pre>
$(illustrate export doc-abc123)
</pre>
</body>
</html>
EOF
```

### Create Markdown Documentation

```bash
$ cat > ARCHITECTURE.md << 'EOF'
# System Architecture

## Component Diagram

\`\`\`ascii
$(illustrate export doc-components)
\`\`\`

## Data Flow

\`\`\`ascii
$(illustrate export doc-dataflow)
\`\`\`
EOF
```

## Performance

```bash
$ time illustrate export doc-abc123 > /dev/null

real    0m0.234s
user    0m0.089s
sys     0m0.024s
```

## Notes

- Output is pure ASCII, no ANSI codes
- Trailing whitespace is trimmed per line
- Empty trailing lines are removed
- Exit code 0 on success, 1 on error
- Errors go to stderr, output to stdout
- Fully composable with standard Unix tools
