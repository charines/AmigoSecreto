// Read-only lookup: prints reveal_token for confirmed participants of an
// existing group, by group title. Never writes to the database.
// Usage: npx tsx --env-file=backend/.env .claude/skills/run-amigosecreto/find-reveal-token.ts "<group title>"

const BACKEND_DIR = new URL('../../../backend', import.meta.url).pathname;

async function main() {
  const title = process.argv[2];
  if (!title) {
    console.error('Uso: find-reveal-token.ts "<titulo do grupo>"');
    process.exit(1);
  }

  const { loadConfig } = await import(`${BACKEND_DIR}/lib/config.js`);
  const { getPool } = await import(`${BACKEND_DIR}/lib/db.js`);

  const config = loadConfig(process.env);
  const pool = getPool(config);

  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.email, p.reveal_token, p.status
     FROM participants p
     JOIN \`groups\` g ON g.id = p.group_id
     WHERE g.title = ? AND p.reveal_token IS NOT NULL
     ORDER BY p.id ASC`,
    [title],
  );

  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

main();
