"""Intent detection and dispatch for Victus input.

The router is deliberately small and deterministic. It decides whether an
utterance should be handled by a local tool or by the AI gateway; the existing
command implementations remain the source of truth for local behavior.
"""

from dataclasses import dataclass
from enum import Enum
import re

import ai_assistant
import commands
import config


class IntentKind(str, Enum):
    """The top-level execution lane for a user request."""

    PC_ACTION = "pc_action"
    PRODUCTIVITY = "productivity"
    SEARCH = "search"
    AI_BRAIN = "ai_brain"


@dataclass(frozen=True)
class DetectedIntent:
    """A normalized classification produced before execution."""

    kind: IntentKind
    text: str


_PC_ACTION = re.compile(
    r"\b(?:open|launch|start|close|volume|mute|unmute|screenshot|capture|"
    r"lock|shutdown|shut down|restart|reboot|cancel shutdown|cancel restart|"
    r"stop listening|go to sleep)\b",
    re.IGNORECASE,
)
_PRODUCTIVITY = re.compile(
    r"\b(?:take a note|remember that|show my notes|list my notes|read my notes|"
    r"clear my notes|delete my notes|remind me to|show my reminders|"
    r"list my reminders|set (?:a )?timer|research|find sources for|summarize|"
    r"clear memory|forget conversation|reset conversation|"
    r"list project files|show project files|read project file|review my code|"
    r"understand this project|analyze this project|generate code for|"
    r"write code for|help me code)\b",
    re.IGNORECASE,
)
_SEARCH = re.compile(
    r"^(?:search(?: for)?|find|look up|play|lyrics|find this song|"
    r"find the song|identify this song)\b",
    re.IGNORECASE,
)


def detect_intent(text: str) -> DetectedIntent:
    """Classify text into a local-tool lane or the AI brain lane."""

    normalized = " ".join(text.split()).strip()
    if not normalized:
        return DetectedIntent(IntentKind.AI_BRAIN, normalized)
    if _PC_ACTION.search(normalized):
        return DetectedIntent(IntentKind.PC_ACTION, normalized)
    if _PRODUCTIVITY.search(normalized):
        return DetectedIntent(IntentKind.PRODUCTIVITY, normalized)
    if _SEARCH.search(normalized):
        return DetectedIntent(IntentKind.SEARCH, normalized)
    return DetectedIntent(IntentKind.AI_BRAIN, normalized)


def route(text: str) -> tuple[DetectedIntent, str]:
    """Detect intent, execute the selected lane, and return its response."""

    intent = detect_intent(text)
    if intent.kind is IntentKind.AI_BRAIN:
        response = ai_assistant.ask(intent.text, config.AI_PROVIDER)
    else:
        response = commands.handle_command(intent.text)
        if response is None:
            response = ai_assistant.ask(intent.text, config.AI_PROVIDER)
    return intent, response
