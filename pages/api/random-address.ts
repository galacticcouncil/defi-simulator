import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://omniwatch.play.hydration.cloud/api/borrowers/by-health');
    const data = await response.json();

    if (data.borrowers && data.borrowers.length > 0) {
      // Return just the addresses array to minimize data transfer
      const addresses = data.borrowers.map((borrower: any) => borrower[0]);
      return res.status(200).json({ addresses });
    }

    return res.status(404).json({ error: 'No borrowers found' });
  } catch (error) {
    console.error('Failed to fetch borrowers:', error);
    return res.status(500).json({ error: 'Failed to fetch borrowers' });
  }
}

