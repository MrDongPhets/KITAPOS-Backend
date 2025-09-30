const { getSupabase } = require('../../config/database');

async function getMovements(req, res) {
  try {
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📊 Getting inventory movements for company:', companyId);

    // Get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    if (storeIds.length === 0) {
      return res.json({ movements: [], count: 0 });
    }

    // Get movements with product details
    const { data: movements, error, count } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        products!fk_inventory_product(name, sku)
      `, { count: 'exact' })
      .in('store_id', storeIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform data to include product name
    const transformedMovements = movements?.map(movement => ({
      ...movement,
      product_name: movement.products?.name || 'Unknown Product',
      product_sku: movement.products?.sku
    })) || [];

    console.log('✅ Movements found:', transformedMovements.length);

    res.json({
      movements: transformedMovements,
      count: count || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get movements error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inventory movements',
      code: 'MOVEMENTS_ERROR'
    });
  }
}

async function createStockAdjustment(req, res) {
  try {
    const companyId = req.user.company_id;
    const userId = req.user.id;
    const supabase = getSupabase();

    const {
      product_id,
      adjustment_type, // 'increase' or 'decrease'
      quantity,
      reason,
      notes
    } = req.body;

    console.log('📦 Creating stock adjustment for product:', product_id);

    // Validate required fields
    if (!product_id || !adjustment_type || !quantity) {
      return res.status(400).json({
        error: 'Product ID, adjustment type, and quantity are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity, name, store_id')
      .eq('id', product_id)
      .in('store_id', storeIds)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    const currentStock = product.stock_quantity || 0;
    const adjustmentQty = parseInt(quantity);
    
    let newStock;
    let movementType;
    
    if (adjustment_type === 'increase') {
      newStock = currentStock + adjustmentQty;
      movementType = 'in';
    } else if (adjustment_type === 'decrease') {
      newStock = Math.max(0, currentStock - adjustmentQty); // Don't go below 0
      movementType = 'out';
    } else {
      return res.status(400).json({
        error: 'Invalid adjustment type. Must be "increase" or "decrease"',
        code: 'INVALID_ADJUSTMENT_TYPE'
      });
    }

    // Start transaction
    const { data: movement, error: movementError } = await supabase
      .from('inventory_movements')
      .insert([{
        product_id: product_id,
        store_id: product.store_id,
        movement_type: 'adjustment',
        quantity: adjustmentQty,
        previous_stock: currentStock,
        new_stock: newStock,
        reference_type: 'manual_adjustment',
        notes: notes || `${adjustment_type} by ${adjustmentQty} - ${reason || 'Manual adjustment'}`,
        created_by: userId
      }])
      .select()
      .single();

    if (movementError) {
      throw movementError;
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Stock adjustment completed:', {
      product: product.name,
      from: currentStock,
      to: newStock,
      adjustment: adjustmentQty
    });

    res.status(201).json({
      message: 'Stock adjustment completed successfully',
      movement: {
        ...movement,
        product_name: product.name
      },
      new_stock: newStock
    });

  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({ 
      error: 'Failed to create stock adjustment',
      code: 'ADJUSTMENT_ERROR'
    });
  }
}

async function getLowStockAlerts(req, res) {
  try {
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('🚨 Getting low stock alerts for company:', companyId);

    // Get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    if (storeIds.length === 0) {
      return res.json({ alerts: [], count: 0 });
    }

    // Get products with low stock (stock_quantity <= min_stock_level)
    const { data: lowStockProducts, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        stock_quantity,
        min_stock_level,
        categories(name)
      `)
      .in('store_id', storeIds)
      .eq('is_active', true)
      .not('min_stock_level', 'is', null)
      .filter('stock_quantity', 'lte', 'min_stock_level');

    if (error) {
      throw error;
    }

    // Also get out of stock products
    const { data: outOfStockProducts, error: outError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        stock_quantity,
        min_stock_level,
        categories(name)
      `)
      .in('store_id', storeIds)
      .eq('is_active', true)
      .eq('stock_quantity', 0);

    if (outError) {
      throw outError;
    }

    const alerts = [
      ...(lowStockProducts || []).map(product => ({
        ...product,
        alert_type: 'low_stock',
        severity: 'warning',
        message: `Only ${product.stock_quantity} units left (Min: ${product.min_stock_level})`
      })),
      ...(outOfStockProducts || []).map(product => ({
        ...product,
        alert_type: 'out_of_stock',
        severity: 'critical',
        message: 'Product is out of stock'
      }))
    ];

    console.log('✅ Alerts found:', alerts.length);

    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch low stock alerts',
      code: 'ALERTS_ERROR'
    });
  }
}

module.exports = {
  getMovements,
  createStockAdjustment,
  getLowStockAlerts
};