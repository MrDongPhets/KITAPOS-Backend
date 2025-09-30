const { getSupabase } = require('../../config/database');

async function getCategories(req, res) {
  try {
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📁 Getting categories for company:', companyId);

    // Get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    if (storeIds.length === 0) {
      return res.json({ categories: [], count: 0 });
    }

    // Get categories with product count - REMOVE the is_active filter
    const { data: categories, error, count } = await supabase
      .from('categories')
      .select(`
        *,
        products(count)
      `, { count: 'exact' })
      .in('store_id', storeIds)
      // .eq('is_active', true)  <-- REMOVE THIS LINE
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    // Transform the data to include product count as a number
    const transformedCategories = categories?.map(category => ({
      ...category,
      product_count: category.products?.[0]?.count || 0
    })) || [];

    console.log('✅ Categories found:', transformedCategories.length);

    res.json({
      categories: transformedCategories,
      count: count || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      code: 'CATEGORIES_ERROR'
    });
  }
}

async function getCategory(req, res) {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📁 Getting category:', id);

    // Get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        *,
        products(id, name, sku, default_price)
      `)
      .eq('id', id)
      .in('store_id', storeIds)
      .eq('is_active', true)
      .single();

    if (error || !category) {
      return res.status(404).json({ 
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    res.json({ 
      category: {
        ...category,
        product_count: category.products?.length || 0
      }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch category',
      code: 'CATEGORY_ERROR'
    });
  }
}

async function createCategory(req, res) {
  try {
    const companyId = req.user.company_id;
    const userId = req.user.id;
    const supabase = getSupabase();

    const {
      name,
      description,
      color,
      icon,
      store_id
    } = req.body;

    console.log('📁 Creating category:', name);

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Category name is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // If no store_id provided, use the first store of the company
    let targetStoreId = store_id;
    if (!targetStoreId) {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);
      
      if (stores && stores.length > 0) {
        targetStoreId = stores[0].id;
      } else {
        return res.status(400).json({
          error: 'No store found for this company',
          code: 'NO_STORE_ERROR'
        });
      }
    }

    // Verify store belongs to company
    const { data: storeCheck } = await supabase
      .from('stores')
      .select('id')
      .eq('id', targetStoreId)
      .eq('company_id', companyId)
      .single();

    if (!storeCheck) {
      return res.status(400).json({
        error: 'Invalid store selected',
        code: 'INVALID_STORE'
      });
    }

    // Check for duplicate category name in this store
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .eq('store_id', targetStoreId)
      .eq('is_active', true)
      .single();

    if (existingCategory) {
      return res.status(409).json({
        error: 'Category name already exists in this store',
        code: 'CATEGORY_EXISTS'
      });
    }

    // Create the category
    const { data: category, error } = await supabase
      .from('categories')
      .insert([{
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        icon: icon || 'folder',
        store_id: targetStoreId,
        created_by: userId,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Category created:', category.name);

    res.status(201).json({
      message: 'Category created successfully',
      category: {
        ...category,
        product_count: 0
      }
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ 
      error: 'Failed to create category',
      code: 'CREATE_CATEGORY_ERROR'
    });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const userId = req.user.id;
    const supabase = getSupabase();

    const {
      name,
      description,
      color,
      icon,
      is_active
    } = req.body;

    console.log('📁 Updating category:', id);

    // Get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    // Verify category exists and belongs to this company
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .in('store_id', storeIds)
      .single();

    if (!existingCategory) {
      return res.status(404).json({
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existingCategory.name) {
      const { data: duplicateCheck } = await supabase
        .from('categories')
        .select('id')
        .eq('name', name)
        .eq('store_id', existingCategory.store_id)
        .eq('is_active', true)
        .neq('id', id)
        .single();

      if (duplicateCheck) {
        return res.status(409).json({
          error: 'Category name already exists in this store',
          code: 'CATEGORY_EXISTS'
        });
      }
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        products(count)
      `)
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Category updated:', category.name);

    res.json({
      message: 'Category updated successfully',
      category: {
        ...category,
        product_count: category.products?.[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ 
      error: 'Failed to update category',
      code: 'UPDATE_CATEGORY_ERROR'
    });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📁 Deleting category:', id);

    // Get store IDs for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(store => store.id) || [];

    // Verify category exists and belongs to this company
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('name, store_id')
      .eq('id', id)
      .in('store_id', storeIds)
      .single();

    if (!existingCategory) {
      return res.status(404).json({
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Check if category has products
    const { data: products, count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('category_id', id)
      .eq('is_active', true);

    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category with ${productCount} products. Please move or delete the products first.`,
        code: 'CATEGORY_HAS_PRODUCTS',
        product_count: productCount
      });
    }

    // Soft delete the category
    const { data: category, error } = await supabase
      .from('categories')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('name')
      .single();

    if (error || !category) {
      return res.status(404).json({ 
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    console.log('✅ Category deleted (soft):', category.name);

    res.json({
      message: 'Category deleted successfully',
      category_name: category.name
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ 
      error: 'Failed to delete category',
      code: 'DELETE_CATEGORY_ERROR'
    });
  }
}

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};