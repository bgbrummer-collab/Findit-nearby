export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ error: "Reference required" });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(400).json({ error: "Verification failed" });
    }

    const paid =
      data.data.status === "success" &&
      data.data.amount === 9900 &&
      data.data.currency === "ZAR";

    return res.status(200).json({
      paid,
      reference: data.data.reference,
    });
  } catch (error) {
    return res.status(500).json({ error: "Verification failed" });
  }
}
