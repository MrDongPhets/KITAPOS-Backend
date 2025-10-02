const { getSupabase } = require('../../config/database');
const bcrypt = require('bcrypt');
const { generateToken } = require('../../services/tokenService');

// Staff PIN Login
async function staffLogin(req, res) {
  try {
    const { staff_id, passcode, store_id } = req.body;

    if (!staff_id || !passcode || !store_id) {
      return res.status(400).json({
        error: 'Staff ID, passcode, and store ID are required'
      });
    }

    const supabase = getSupabase();

    // Get staff by staff_id and store_id
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('staff_id', staff_id)
      .eq('store_id', store_id)
      .eq('is_active', true)
      .single();

    if (error || !staff) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify passcode
    const isValidPasscode = await bcrypt.compare(passcode, staff.passcode);
    if (!isValidPasscode) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate token for staff
    const token = generateToken({
      id: staff.id,
      email: `staff_${staff.staff_id}@internal.pos`,
      role: staff.role,
      company_id: staff.company_id,
      store_id: staff.store_id
    }, 'staff');

    // Update last login
    await supabase
      .from('staff')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', staff.id);

    res.json({
      token,
      userType: 'staff',
      staff: {
        id: staff.id,
        staff_id: staff.staff_id,
        name: staff.name,
        role: staff.role,
        store_id: staff.store_id,
        company_id: staff.company_id,
        image_url: staff.image_url
      }
    });

  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Verify Staff Token
async function verifyStaffToken(req, res) {
  try {
    // Token is already verified by middleware
    const staffId = req.user.id;
    const supabase = getSupabase();

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .eq('is_active', true)
      .single();

    if (error || !staff) {
      return res.status(401).json({
        valid: false,
        error: 'Staff not found or inactive'
      });
    }

    res.json({
      valid: true,
      staff: {
        id: staff.id,
        staff_id: staff.staff_id,
        name: staff.name,
        role: staff.role,
        store_id: staff.store_id,
        company_id: staff.company_id
      }
    });

  } catch (error) {
    console.error('Verify staff token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  staffLogin,
  verifyStaffToken
};