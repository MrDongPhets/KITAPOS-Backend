const { getSupabase } = require('../../config/database');

// Search products (with barcode support)
async function searchProducts(req, res) {
  try {
    const { query, store_id } = req.query;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name, color, icon)
      `)
      .eq('store_id', store_id)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query}`)
      .gt('stock_quantity', 0)
      .limit(20);

    if (error) throw error;

    res.json({ products: products || [] });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
}

// Get products by category
async function getProductsByCategory(req, res) {
  try {
    const { category_id, store_id } = req.query;
    const supabase = getSupabase();

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(id, name, color, icon)
      `)
      .eq('store_id', store_id)
      .eq('is_active', true)
      .gt('stock_quantity', 0);

    if (category_id && category_id !== 'all') {
      query = query.eq('category_id', category_id);
    }

    const { data: products, error } = await query.order('name');

    if (error) throw error;

    res.json({ products: products || [] });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

// Calculate pricing with discounts
async function calculatePrice(req, res) {
  try {
    const { items, discount_type, discount_value } = req.body;

    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount_amount = 0;

    if (discount_type === 'percentage') {
      discount_amount = (subtotal * discount_value) / 100;
    } else if (discount_type === 'fixed') {
      discount_amount = discount_value;
    }

    const total = subtotal - discount_amount;

    res.json({
      subtotal,
      discount_amount,
      total,
      items_count: items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({ error: 'Failed to calculate price' });
  }
}

module.exports = {
  searchProducts,
  getProductsByCategory,
  calculatePrice
};