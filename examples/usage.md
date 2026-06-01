# Mythsensus MCP — Usage Examples

After installing the MCP into your Claude Desktop, try these prompts.

## Example 1 · Cosmic Score for yourself

> You: What's my Cosmic Score? I was born March 15, 1990.

Claude will call `calculate_cosmic_score({year:1990, month:3, day:15})` and
return something like:

```
Your Cosmic Score is 712/999 — "Resonant" tier (Top 35%).
Sun in Pisces. BaZi day master is Yin Wood. Life Path 3.
Mayan Kin 207. Human Design: Manifestor.
```

## Example 2 · Deep reading for one system

> You: Get my BaZi deep reading.

If Claude remembers your DOB from before, it'll call
`get_deep_reading({year:1990, month:3, day:15, system:"bazi"})` and return
the BaZi-specific output from the engine.

## Example 3 · List all 26 systems

> You: What systems does Mythsensus support?

Claude calls `list_26_systems()` and returns the canonical list including
BaZi, Vedic, Western, Nine Star Ki, Thai Seven Number, Mayan Tzolk'in,
Norse Runes, Celtic Tree, etc.

## Example 4 · Daily blessing

> You: Draw today's deity blessing for my chart.

Claude calls `daily_blessing({year:1990, month:3, day:15})` and returns a
deity card. The same chart on the same day always draws the same deity
(deterministic).

## Example 5 · Honest engine limitations

> You: How accurate is the Mythsensus engine? Should I trust it for Vedic?

Claude calls `about_mythsensus_engine()` and returns the structured metadata
including:
- Lahiri ayanamsa hardcoded at 24.0° (drift implications)
- BaZi solar terms approximated to month boundaries
- No divisional charts (D-9 Navamsha, etc.) implemented
- v2 sophistication roadmap

This lets your Claude give you an honest answer about whether the engine
is appropriate for your use case.

## Example 6 · Historical figures (verify engine determinism)

> You: Calculate the Cosmic Score for Steve Jobs (born February 24, 1955,
> 7:15 PM, San Francisco).

Claude calls `calculate_cosmic_score` with that input. Expected output:
Score ~754, "Resonant" tier, Pisces Sun, Aries Moon, BaZi 戊 (Yang Earth)
day master, Life Path 1, Human Design Manifestor.

You can run the same query multiple times and verify the output is
identical (deterministic).

## Verifying privacy

While Claude calls these tools, open your system's network monitor (Activity
Monitor on macOS, Task Manager on Windows). Watch the `node` process running
this MCP server. **There should be zero network traffic** from this process
during tool calls — all computation runs locally.

If you see network calls, please open a GitHub issue — that would be a bug.
