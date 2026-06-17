import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationDisplay } from "../ToolInvocationDisplay";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, any>,
  state: ToolInvocation["state"] = "call",
  result?: any
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "id", toolName, args, state, result } as ToolInvocation;
  }
  return { toolCallId: "id", toolName, args, state } as ToolInvocation;
}

// str_replace_editor labels

test("str_replace_editor create shows Creating {filename}", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "src/components/Button.tsx",
      })}
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("str_replace_editor str_replace shows Editing {filename}", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "str_replace",
        path: "src/components/Button.tsx",
      })}
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("str_replace_editor insert shows Editing {filename}", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "insert",
        path: "src/hooks/useData.ts",
      })}
    />
  );
  expect(screen.getByText("Editing useData.ts")).toBeDefined();
});

test("str_replace_editor view shows Reading {filename}", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "view",
        path: "src/lib/utils.ts",
      })}
    />
  );
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

test("str_replace_editor undo_edit shows Undoing edit on {filename}", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "undo_edit",
        path: "src/app/page.tsx",
      })}
    />
  );
  expect(screen.getByText("Undoing edit on page.tsx")).toBeDefined();
});

// file_manager labels

test("file_manager rename shows Renaming {filename} → {new filename}", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("file_manager", {
        command: "rename",
        path: "src/components/OldName.tsx",
        new_path: "src/components/NewName.tsx",
      })}
    />
  );
  expect(screen.getByText("Renaming OldName.tsx → NewName.tsx")).toBeDefined();
});

test("file_manager delete shows Deleting {filename}", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("file_manager", {
        command: "delete",
        path: "src/components/Unused.tsx",
      })}
    />
  );
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

// Filename extraction

test("extracts basename from a deeply nested path", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "view",
        path: "a/b/c/d/DeepFile.tsx",
      })}
    />
  );
  expect(screen.getByText("Reading DeepFile.tsx")).toBeDefined();
});

test("works with a bare filename (no directory)", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "index.ts",
      })}
    />
  );
  expect(screen.getByText("Creating index.ts")).toBeDefined();
});

// Loading vs done visual state

test("loading state renders spinner, not green dot", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "Foo.tsx" },
        "call"
      )}
    />
  );
  expect(container.querySelector("svg")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("done state renders green dot, not spinner", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "Foo.tsx" },
        "result",
        "Success"
      )}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector("svg")).toBeNull();
});

test("partial-call state renders spinner", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "view", path: "Bar.tsx" },
        "partial-call"
      )}
    />
  );
  expect(container.querySelector("svg")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// Fallback

test("unknown tool name falls back to toolName", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("web_search", { query: "hello" })}
    />
  );
  expect(screen.getByText("web_search")).toBeDefined();
});

test("unknown command on known tool falls back to toolName", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "unknown_command",
        path: "Foo.tsx",
      })}
    />
  );
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});
