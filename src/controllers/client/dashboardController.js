// src/controllers/client/dashboardController.js - FIXED VERSION
const { getSupabase } = require('../../config/database');

async function getDashboardOverview(req, res) {
  try {
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📊 Getting dashboard overview for company:', companyId);

    // Get today's sales total
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('company_id', companyId)
      .gte('created_at', today + 'T00:00:00.000Z')
      .lt('created_at', today + 'T23:59:59.999Z');

    const totalSales = todaySales?.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) || 0;

    // First get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    // Get total products count
    let totalProducts = 0;
    if (storeIds.length > 0) {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('store_id', storeIds);
      
      totalProducts = count || 0;
    }

    // Get total staff count
    const { count: totalStaff } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true);

    // Get low stock items count
    let lowStockCount = 0;
    if (storeIds.length > 0) {
      const { data: lowStockItems } = await supabase
        .from('products')
        .select('id, stock_quantity, min_stock_level')
        .eq('is_active', true)
        .in('store_id', storeIds);

      lowStockCount = lowStockItems?.filter(item => 
        item.stock_quantity <= item.min_stock_level
      ).length || 0;
    }

    console.log('✅ Dashboard overview:', { totalSales, totalProducts, totalStaff, lowStockCount });

    res.json({
      overview: {
        totalSales,
        totalProducts,
        totalStaff: totalStaff || 0,
        lowStockItems: lowStockCount
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard overview',
      code: 'DASHBOARD_ERROR'
    });
  }
}

async function getRecentSales(req, res) {
  try {
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📊 Getting recent sales for company:', companyId);

    const { data: recentSales, error } = await supabase
      .from('sales')
      .select(`
        id,
        total_amount,
        items_count,
        created_at,
        staff!inner(name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Recent sales query error:', error);
      throw error;
    }

    const formattedSales = recentSales?.map(sale => ({
      id: sale.id,
      date: sale.created_at,
      amount: parseFloat(sale.total_amount),
      items: sale.items_count || 1,
      staff: sale.staff?.name || 'Unknown'
    })) || [];

    console.log('✅ Recent sales found:', formattedSales.length);

    res.json({ recentSales: formattedSales });

  } catch (error) {
    console.error('Recent sales error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent sales',
      code: 'SALES_ERROR'
    });
  }
}

async function getLowStockProducts(req, res) {
  try {
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📊 Getting low stock products for company:', companyId);

    // First get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    if (storeIds.length === 0) {
      console.log('ℹ️ No stores found for company');
      return res.json({ lowStockProducts: [] });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        stock_quantity,
        min_stock_level,
        categories(name)
      `)
      .in('store_id', storeIds)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true });

    if (error) {
      console.error('Low stock products query error:', error);
      throw error;
    }

    // Filter products where stock <= min_stock_level
    const filteredProducts = products?.filter(product => 
      product.stock_quantity <= product.min_stock_level
    ).slice(0, 10).map(product => ({
      id: product.id,
      name: product.name,
      stock: product.stock_quantity,
      minStock: product.min_stock_level,
      category: product.categories?.name || 'Uncategorized'
    })) || [];

    console.log('✅ Low stock products found:', filteredProducts.length);

    res.json({ lowStockProducts: filteredProducts });

  } catch (error) {
    console.error('Low stock products error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch low stock products',
      code: 'LOW_STOCK_ERROR'
    });
  }
}

async function getTopProducts(req, res) {
  try {
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📊 Getting top products for company:', companyId);

    // First get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    if (storeIds.length === 0) {
      console.log('ℹ️ No stores found for company');
      return res.json({ topProducts: [] });
    }

    // Get some products for mock data
    const { data: products } = await supabase
      .from('products')
      .select('name, default_price')
      .in('store_id', storeIds)
      .eq('is_active', true)
      .limit(4);

    // Mock top products data (you'll need to implement proper sales tracking later)
    const mockTopProducts = products?.map((product, index) => ({
      name: product.name,
      sales: Math.floor(Math.random() * 100) + 50, // Random sales count
      revenue: (Math.floor(Math.random() * 100) + 50) * parseFloat(product.default_price || 0)
    })).sort((a, b) => b.sales - a.sales) || [];

    console.log('✅ Top products found:', mockTopProducts.length);

    res.json({ topProducts: mockTopProducts });

  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top products',
      code: 'TOP_PRODUCTS_ERROR'
    });
  }
}

async function getStores(req, res) {
  try {
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📊 Getting stores for company:', companyId);

    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, is_active')
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    // Get sales for each store (today)
    const today = new Date().toISOString().split('T')[0];
    const storesWithSales = await Promise.all(stores?.map(async (store) => {
      const { data: storeSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('store_id', store.id)
        .gte('created_at', today + 'T00:00:00.000Z')
        .lt('created_at', today + 'T23:59:59.999Z');

      const totalSales = storeSales?.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) || 0;

      return {
        id: store.id,
        name: store.name,
        status: store.is_active ? 'active' : 'inactive',
        sales: totalSales
      };
    }) || []);

    console.log('✅ Stores with sales found:', storesWithSales.length);

    res.json({ stores: storesWithSales });

  } catch (error) {
    console.error('Stores error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stores',
      code: 'STORES_ERROR'
    });
  }
}

module.exports = {
  getDashboardOverview,
  getRecentSales,
  getLowStockProducts,
  getTopProducts,
  getStores
};