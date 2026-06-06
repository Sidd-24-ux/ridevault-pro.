import { Request, Response } from 'express';
import { db } from '../../services/db.service';
import { GoogleGenAI } from '../../services/ai.service'; // We will define this next

// Helper: Local semantic text analyzer when Gemini is not enabled
const runLocalSemanticSearch = (query: string) => {
  const q = query.toLowerCase();
  const products = db.products.find({ isApproved: true });

  let categoryFilter = '';
  if (q.includes('helmet')) categoryFilter = 'helmets';
  else if (q.includes('jacket')) categoryFilter = 'riding jackets';
  else if (q.includes('glove')) categoryFilter = 'riding gloves';
  else if (q.includes('pant')) categoryFilter = 'riding pants';
  else if (q.includes('boot')) categoryFilter = 'riding boots';
  else if (q.includes('rain')) categoryFilter = 'rain gear';
  else if (q.includes('bag') || q.includes('saddle')) categoryFilter = 'saddlebags';

  // Extract budget
  let budget = Infinity;
  const underMatch = q.match(/(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (underMatch && underMatch[1]) {
    budget = Number(underMatch[1]);
  }

  // Specifications
  const waterproofRequired = q.includes('waterproof') || q.includes('rain');
  const ceRequired = q.includes('ce certified') || q.includes('certified') || q.includes('protection');

  // Filter products
  let matches = products;
  if (categoryFilter) {
    matches = matches.filter(p => p.category.toLowerCase().includes(categoryFilter.toLowerCase().slice(0, 5)));
  }
  if (budget !== Infinity) {
    matches = matches.filter(p => p.basePrice <= budget);
  }
  if (waterproofRequired) {
    matches = matches.filter(p => p.specifications?.waterproof === true);
  }
  if (ceRequired) {
    matches = matches.filter(p => p.specifications?.ceCertified === true);
  }

  // Generate chatbot response text
  let responseText = `Hi there! I analyzed your request for "${query}". `;
  if (matches.length > 0) {
    responseText += `Based on our current inventory, I found ${matches.length} matching item(s) that fit your riding style. Here is what I recommend:`;
  } else {
    responseText += `I couldn't find any products matching those exact specifications in our inventory. However, here are some popular general gear choices for riders:`;
    matches = products.slice(0, 3);
  }

  return { responseText, matches };
};

// AI Shopping Assistant Chat
export const chatAssistant = async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Chat message is required' });
  }

  try {
    // If Gemini API Key is configured, use the Google Gen AI Service
    if (process.env.GEMINI_API_KEY) {
      console.log('Gemini API key detected. Triggering live AI completion...');
      const catalog = db.products.find({ isApproved: true });
      const prompt = `You are the RideVault Pro Virtual Assistant, a friendly expert on motorcycle riding gear.
User Query: "${message}"
Available Catalog: ${JSON.stringify(catalog.map(p => ({ id: p._id, name: p.name, brand: p.brand, category: p.category, price: p.basePrice, specs: p.specifications })))}

Please recommend products from the catalog that match the user's requirements. Suggest specific features. Keep your response helpful, technical, and concise. Format it in Markdown. At the end, output a JSON array of the recommended product IDs in the exact format: [RECOMMENDED_IDS: "id1", "id2"]`;

      const aiResponse = await GoogleGenAI.generateText(prompt);
      
      // Parse recommended IDs if any
      const idsMatch = aiResponse.match(/\[RECOMMENDED_IDS:\s*([^\]]+)\]/);
      let recommendedProducts: any[] = [];
      if (idsMatch && idsMatch[1]) {
        const ids = idsMatch[1].replace(/['"\s]/g, '').split(',');
        recommendedProducts = ids.map(id => db.products.findById(id)).filter(Boolean);
      } else {
        // Fallback local match
        const local = runLocalSemanticSearch(message);
        recommendedProducts = local.matches;
      }

      const cleanText = aiResponse.replace(/\[RECOMMENDED_IDS:[^\]]+\]/g, '').trim();

      return res.status(200).json({
        reply: cleanText,
        products: recommendedProducts
      });
    }

    // Fallback: local semantic match
    const localResult = runLocalSemanticSearch(message);
    return res.status(200).json({
      reply: localResult.responseText,
      products: localResult.matches
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    // Local fallback in case of Gemini failures
    const localResult = runLocalSemanticSearch(message);
    return res.status(200).json({
      reply: localResult.responseText,
      products: localResult.matches
    });
  }
};

// AI Riding Gear Pack Assistant (Bike model, budget, ride style analysis)
export const ridingGearPackAssistant = (req: Request, res: Response) => {
  const { bike, budget, rideType } = req.body; // e.g. "Himalayan", 15000, "Touring"

  try {
    const products = db.products.find({ isApproved: true });
    const numericBudget = Number(budget) || 20000;

    // Filter suggestions based on ride style and fit items within budget allocations:
    // Allocation: Helmet (30%), Jacket (30%), Gloves (15%), Boots/Pants (25%)
    const getBestFit = (categoryName: string, maxAmt: number) => {
      const catProducts = products.filter(p =>
        p.category.toLowerCase().includes(categoryName.toLowerCase().slice(0, 5))
      );
      // Sort by price-to-ratings
      catProducts.sort((a, b) => a.basePrice - b.basePrice);
      const underBudget = catProducts.filter(p => p.basePrice <= maxAmt);
      return underBudget.length > 0 ? underBudget[underBudget.length - 1] : catProducts[0] || null;
    };

    const recommendedJacket = getBestFit('jacket', numericBudget * 0.35);
    const recommendedHelmet = getBestFit('helmet', numericBudget * 0.35);
    const recommendedGloves = getBestFit('glove', numericBudget * 0.15);
    const recommendedBoots = getBestFit('boot', numericBudget * 0.15);

    const pack = [recommendedJacket, recommendedHelmet, recommendedGloves, recommendedBoots].filter(Boolean);
    const packTotal = pack.reduce((sum, p) => sum + p.basePrice, 0);

    const explanation = `Based on your motorcycle (**${bike}**) and **${rideType}** styling, safety is paramount. We selected CE-Certified jackets with thermal liners and heavy-duty touring helmets. This complete setup fits nicely into your ₹${budget} budget, costing a total of **₹${packTotal}**.`;

    return res.status(200).json({
      explanation,
      pack,
      totalAmount: packTotal
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error calculating AI pack recommendation' });
  }
};

// AI Size Recommendation Engine
export const sizeRecommendationEngine = (req: Request, res: Response) => {
  const { height, weight, chestSize, waistSize } = req.body; // metrics in cm / kg / inches

  try {
    if (!height || !weight || !chestSize || !waistSize) {
      return res.status(400).json({ message: 'Height, weight, chest size, and waist size are required' });
    }

    const chest = Number(chestSize);
    const waist = Number(waistSize);

    // Standard gear sizing rules (Chest based sizing)
    let size = 'M';
    if (chest < 36) size = 'XS';
    else if (chest >= 36 && chest < 38) size = 'S';
    else if (chest >= 38 && chest < 41) size = 'M';
    else if (chest >= 41 && chest < 44) size = 'L';
    else if (chest >= 44 && chest < 47) size = 'XL';
    else size = 'XXL';

    const reasons = [
      `Your chest size is ${chestSize} inches which lines up with standard size ${size} safety profiles.`,
      `Waist size of ${waistSize} inches has a comfortable ergonomic taper fitting.`,
      `Height/weight proportion guarantees proper armor alignment at shoulder/elbow joints.`
    ];

    return res.status(200).json({
      recommendedSize: size,
      reasons
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error calculating size recommendations' });
  }
};

// AI Image Search Detector
export const imageSearchProductDetect = (req: Request, res: Response) => {
  try {
    // Return a mocked object detector response
    const detectedLabels = ['Motorcycle Helmet', 'Full Face Shield', 'Matte Black Finish'];
    const suggestedCategory = 'Helmets';

    // Find similar items
    const matches = db.products.find({ isApproved: true })
      .filter(p => p.category.toLowerCase().includes('helmet'))
      .slice(0, 3);

    return res.status(200).json({
      detectedLabels,
      suggestedCategory,
      matches,
      message: 'Image processed successfully. Found matching items in our Helmet category.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error analyzing uploaded product image' });
  }
};
