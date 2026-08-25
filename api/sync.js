/**
 * VYNTA LOYALTY - Serverless Cloud Database Synchronization API
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO_OWNER = 'Latiguillo';
const REPO_NAME = 'Vynta-loyalty';
const FILE_PATH = 'data/cloud_db.json';
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

// In-memory cache for fast sub-second read performance
let memoryCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 2000; // 2 seconds cache

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const githubHeaders = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'User-Agent': 'VyntaCloudSyncServerless',
    'Accept': 'application/vnd.github.v3+json'
  };

  if (req.method === 'GET') {
    try {
      const now = Date.now();
      if (memoryCache && (now - lastFetchTime < CACHE_TTL_MS)) {
        return res.status(200).json(memoryCache);
      }

      const response = await fetch(GITHUB_API_URL, {
        headers: githubHeaders,
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(200).json({ status: 'empty', data: null });
        }
        return res.status(response.status).json({ error: 'GitHub API error' });
      }

      const fileData = await response.json();
      const contentStr = Buffer.from(fileData.content, 'base64').toString('utf8');
      const parsed = JSON.parse(contentStr);

      memoryCache = {
        data: parsed,
        sha: fileData.sha,
        updated_at: parsed.updated_at || new Date().toISOString()
      };
      lastFetchTime = now;

      return res.status(200).json(memoryCache);
    } catch (err) {
      console.error('Sync GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = req.body;
      const dataPayload = (body && body.data) ? body.data : body;

      if (!dataPayload || typeof dataPayload !== 'object') {
        return res.status(400).json({ error: 'Invalid data payload' });
      }

      dataPayload.updated_at = new Date().toISOString();

      // 1. Get current SHA if not cached
      let sha = body.sha || (memoryCache ? memoryCache.sha : null);
      if (!sha) {
        try {
          const getFileRes = await fetch(GITHUB_API_URL, { headers: githubHeaders });
          if (getFileRes.ok) {
            const getFileJson = await getFileRes.json();
            sha = getFileJson.sha;
          }
        } catch (e) {}
      }

      // 2. Prepare payload for GitHub
      const jsonContent = JSON.stringify(dataPayload, null, 2);
      const b64Content = Buffer.from(jsonContent, 'utf8').toString('base64');

      const commitBody = {
        message: `Cloud database sync [${new Date().toISOString()}]`,
        content: b64Content
      };
      if (sha) {
        commitBody.sha = sha;
      }

      const putResponse = await fetch(GITHUB_API_URL, {
        method: 'PUT',
        headers: {
          ...githubHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commitBody)
      });

      if (!putResponse.ok) {
        if (putResponse.status === 409) {
          const refetchRes = await fetch(GITHUB_API_URL, { headers: githubHeaders });
          if (refetchRes.ok) {
            const refetchJson = await refetchRes.json();
            commitBody.sha = refetchJson.sha;
            const retryRes = await fetch(GITHUB_API_URL, {
              method: 'PUT',
              headers: { ...githubHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify(commitBody)
            });
            if (retryRes.ok) {
              const retryJson = await retryRes.json();
              memoryCache = { data: dataPayload, sha: retryJson.content?.sha, updated_at: dataPayload.updated_at };
              lastFetchTime = Date.now();
              return res.status(200).json({ success: true, updated_at: dataPayload.updated_at });
            }
          }
        }
        const errText = await putResponse.text();
        return res.status(putResponse.status).json({ error: errText });
      }

      const putData = await putResponse.json();
      memoryCache = {
        data: dataPayload,
        sha: putData.content?.sha,
        updated_at: dataPayload.updated_at
      };
      lastFetchTime = Date.now();

      return res.status(200).json({
        success: true,
        sha: putData.content?.sha,
        updated_at: dataPayload.updated_at
      });
    } catch (err) {
      console.error('Sync POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
