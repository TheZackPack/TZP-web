import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'TheZackPack';
const REPO_NAME = 'TZP-server';

// Simple in-memory rate limiter: 1 request per IP per minute
const rateLimitMap = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip);
  if (lastRequest && now - lastRequest < 60_000) {
    return true;
  }
  rateLimitMap.set(ip, now);
  return false;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamp] of rateLimitMap) {
    if (now - timestamp > 60_000) {
      rateLimitMap.delete(ip);
    }
  }
}, 300_000);

export async function POST(request: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'Bug reporting is not configured' }, { status: 503 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Rate limited. Try again in a minute.' }, { status: 429 });
    }

    const body = await request.json();
    const { title, description, reporter } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    if (typeof title !== 'string' || title.length > 200) {
      return NextResponse.json({ error: 'Title must be under 200 characters' }, { status: 400 });
    }

    if (typeof description !== 'string' || description.length > 5000) {
      return NextResponse.json({ error: 'Description must be under 5000 characters' }, { status: 400 });
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const issueBody = [
      `**Reported by:** ${reporter || 'Anonymous'}`,
      `**Source:** TZP Web Dashboard`,
      '',
      '---',
      '',
      description,
    ].join('\n');

    const issue = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `[Bug Report] ${title}`,
      body: issueBody,
      labels: ['bug', 'web-report'],
    });

    return NextResponse.json(
      {
        success: true,
        issueNumber: issue.data.number,
        issueUrl: issue.data.html_url,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Bug report error:', err);
    return NextResponse.json({ error: 'Failed to create bug report' }, { status: 500 });
  }
}
