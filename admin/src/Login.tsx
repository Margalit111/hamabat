import { useState } from "react";
import { api, ApiError } from "./api";
import { Banner, Text } from "./ui";

export default function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(password);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "לא הצלחנו להתחבר, נסי שוב");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <form className="card login" onSubmit={submit}>
        <h1>מערכת הניהול של מבט</h1>
        <p className="muted">כדי לערוך את האתר, יש להזין את הסיסמה.</p>
        {error && <Banner kind="err">{error}</Banner>}
        <Text label="סיסמה" type="password" value={password} onChange={setPassword} ltr />
        <button className="btn" disabled={busy || !password}>{busy ? "מתחברת..." : "כניסה"}</button>
      </form>
    </div>
  );
}
