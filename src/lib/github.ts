import { Octokit } from "@octokit/rest";

const REPO_OWNER = "TheZackPack";
const BUG_REPO = "TZP-server";
const LAUNCHER_REPO = "TZP-launcher";

function getOctokit(): Octokit | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return null;
  }

  return new Octokit({ auth: token });
}

export async function createBugIssue(input: {
  title: string;
  body: string;
  labels: string[];
}) {
  const octokit = getOctokit();
  if (!octokit) {
    return null;
  }

  const issue = await octokit.issues.create({
    owner: REPO_OWNER,
    repo: BUG_REPO,
    title: input.title,
    body: input.body,
    labels: input.labels,
  });

  return {
    issueNumber: issue.data.number,
    issueUrl: issue.data.html_url,
  };
}

export async function fetchLatestLauncherRelease() {
  const octokit = getOctokit();

  if (octokit) {
    const release = await octokit.repos.getLatestRelease({
      owner: REPO_OWNER,
      repo: LAUNCHER_REPO,
    });
    return release.data;
  }

  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${LAUNCHER_REPO}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "TZP-web",
      },
      next: { revalidate: 300 },
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub release lookup failed with status ${response.status}`);
  }

  return response.json();
}
