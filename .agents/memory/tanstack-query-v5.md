---
name: TanStack Query v5 patterns
description: Breaking changes from v4 → v5 relevant to this codebase
---

This project uses `@tanstack/react-query` ^5.90.21.

**onSuccess / onError / onSettled removed from useQuery:**
In v5 these callbacks were removed from `useQuery`. Use `useEffect` watching `data` instead:

```js
// WRONG (v4):
useQuery({ queryFn: ..., onSuccess: (d) => setState(d.value) });

// CORRECT (v5):
const { data } = useQuery({ queryFn: ... });
useEffect(() => { if (data?.value) setState(data.value); }, [data]);
```

**onSuccess still works on useMutation** — only useQuery dropped it.

**Why:** TanStack Query v5 was a major overhaul; callback options on queries were removed to simplify the mental model and avoid stale closure issues.
