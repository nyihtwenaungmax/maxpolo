import json
import logging
import os

import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

# --- Configuration ---
# Set these as Application Settings on the Static Web App / Functions resource
# (Portal -> your Static Web App -> Environment variables), not hardcoded here.
PROJECT_ENDPOINT = os.environ.get("FOUNDRY_PROJECT_ENDPOINT", "")
AGENT_NAME = os.environ.get("FOUNDRY_AGENT_NAME", "sun-knowledge-agent")

_credential = None
_project_client = None
_openai_client = None


def _get_openai_client():
    """Lazily create and cache the clients across warm invocations."""
    global _credential, _project_client, _openai_client

    if _openai_client is not None:
        return _openai_client

    if not PROJECT_ENDPOINT:
        raise RuntimeError(
            "FOUNDRY_PROJECT_ENDPOINT is not set. Add it under Application settings."
        )

    _credential = DefaultAzureCredential()
    _project_client = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=_credential)
    _openai_client = _project_client.get_openai_client()
    return _openai_client


def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Request body must be JSON."}),
            status_code=400,
            mimetype="application/json",
        )

    user_message = (body.get("message") or "").strip()
    if not user_message:
        return func.HttpResponse(
            json.dumps({"error": "Field 'message' is required and cannot be empty."}),
            status_code=400,
            mimetype="application/json",
        )

    try:
        openai_client = _get_openai_client()

        conversation = openai_client.conversations.create()
        response = openai_client.responses.create(
            conversation=conversation.id,
            input=user_message,
            extra_body={"agent_reference": {"name": AGENT_NAME, "type": "agent_reference"}},
        )

        reply_text = getattr(response, "output_text", None) or "I couldn't generate a response."

        return func.HttpResponse(
            json.dumps({"reply": reply_text}),
            status_code=200,
            mimetype="application/json",
        )

    except Exception as exc:  # noqa: BLE001 - surface a clean error to the frontend
        logging.exception("Error calling Foundry agent")
        return func.HttpResponse(
            json.dumps({"error": f"Agent call failed: {str(exc)}"}),
            status_code=500,
            mimetype="application/json",
        )
