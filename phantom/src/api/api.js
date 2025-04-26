import { neon } from '@neondatabase/serverless';

const db = neon('postgres://neondb_owner:npg_OaNwY5nyzi4b@ep-silent-bush-a4e5duz0-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require');

// Create
export async function createOrder(orderData) {
    console.log(orderData);
    
    const query = `
        INSERT INTO phantom_orders (
            dealer_id,
            order_number,
            total_amount,
            is_cash_payment,
            items,
            shipping_address,
            customer_details,
            status,
            payment_details
        ) VALUES ($1, $2, $3, $4, $5::jsonb[], $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb)
        RETURNING *`;

    const values = [
        orderData.dealerId,
        `ORD-${Date.now()}`,
        orderData.totalAmount,
        orderData.isCashPayment,
        orderData.items,
        orderData.shippingAddress,
        orderData.customerDetails,
        orderData.status,
        orderData.paymentDetails || {requiredAmount : orderData.totalAmount}
    ];

    try {
        const result = await db.query(query, values);
        console.log(result);
        
        return result;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Read
export async function getOrders() {
    try {
        const result = await db.query('SELECT A.*, B.name AS dealer_name FROM (SELECT * FROM phantom_orders) AS A LEFT JOIN (SELECT id, name FROM phantom_dealers) AS B ON A.dealer_id = B.id ORDER BY created_at DESC');
        console.log('Orders query result:', result);
        return result;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return { rows: [] };
    }
}

export async function getAdminLedger() {
    try {
        const result = await db.query("WITH payment_table AS (SELECT order_number, dealer_id, payment_details -> 'payments' AS payments FROM phantom_orders) SELECT name AS dealer_name, order_number, debit, credit, date, note FROM (SELECT order_number, dealer_id, total_amount AS debit, 0 AS credit, CAST(order_date AS TIMESTAMP) AS date, '' AS note FROM phantom_orders UNION ALL SELECT order_number, dealer_id, 0 AS debit, CAST(payment -> 'amount' AS DOUBLE PRECISION) AS credit, CAST(CAST(payment -> 'date' AS TEXT) AS TIMESTAMP) AS date, CAST(payment -> 'notes' AS TEXT) AS note FROM payment_table, jsonb_array_elements(payments) AS payment ORDER BY dealer_id, order_number, debit DESC, date) AS A LEFT JOIN (SELECT id, name FROM phantom_dealers) AS B ON A.dealer_id = B.id")
        console.log('Admin ledger query result:', result, typeof(result));
        return result;
    } catch (error) {
        console.error('Error fetching admin ledger:', error);
        return { rows: [] };
    }
}

export async function getDealerLedger(dealerId) {
    try {
        const result = await db.query(`WITH payment_table AS (SELECT order_number, dealer_id, payment_details -> 'payments' AS payments FROM phantom_orders WHERE dealer_id = $1)

SELECT order_number, debit, credit, date, note FROM (SELECT order_number, dealer_id, total_amount AS debit, 0 AS credit, CAST(order_date AS TIMESTAMP) AS date, '' AS note FROM phantom_orders WHERE dealer_id = $1
UNION ALL
SELECT order_number, dealer_id, 0 AS debit, CAST(payment -> 'amount' AS DOUBLE PRECISION) AS credit, CAST(CAST(payment -> 'date' AS TEXT) AS TIMESTAMP) AS date, CAST(payment -> 'notes' AS TEXT) AS note
FROM payment_table, jsonb_array_elements(payments) AS payment)
ORDER BY dealer_id, order_number, debit DESC, date`, [dealerId])
        console.log('Admin ledger query result:', result, typeof(result));
        return result;
    } catch (error) {
        console.error('Error fetching admin ledger:', error);
        return { rows: [] };
    }
}

export async function getOrderById(orderId) {
    try {
        const result = await db.query('SELECT * FROM phantom_orders WHERE id = $1', [orderId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
}

// Update
export async function updateOrder(orderId, updateData) {
    console.log('Updating order:', orderId, updateData);
    
    const query = `
        UPDATE phantom_orders 
        SET 
            total_amount = $1,
            is_cash_payment = $2,
            items = $3::jsonb[],
            shipping_address = $4::jsonb,
            customer_details = $5::jsonb,
            status = $6::jsonb,
            payment_details = $7::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *`;

    const values = [
        updateData.totalAmount,
        updateData.isCashPayment,
        updateData.items,
        updateData.shippingAddress,
        updateData.customerDetails,
        updateData.status,
        updateData.paymentDetails,
        orderId
    ];

    try {
        const result = await db.query(query, values);
        console.log('Update result:', result);
        return result;
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
}

// Delete
export async function deleteOrder(orderId) {
    try {
        await db.query('DELETE FROM phantom_orders WHERE id = $1', [orderId]);
        return true;
    } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
}

// Get orders by dealer
export async function getOrdersByDealer(dealerId) {
    try {
        const result = await db.query(`
            SELECT o.*, d.pricing as dealer_pricing 
            FROM phantom_orders o
            JOIN phantom_dealers d ON o.dealer_id = d.id
            WHERE o.dealer_id = $1 
            ORDER BY o.created_at DESC`,
            [dealerId]
        );
        console.log('Dealer orders result:', result);
        return result;
    } catch (error) {
        console.error('Error fetching dealer orders:', error);
        return { rows: [] };
    }
}

// Update order status
export async function updateOrderStatus(orderId, status) {
    try {
        const result = await db.query(
            'UPDATE phantom_orders SET status = $1::jsonb WHERE id = $2 RETURNING *',
            [status, orderId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

export async function getDealers() {
    try {
        const result = await db.query(`
            SELECT id, name, address, phone, email, role, gst_no, pricing 
            FROM phantom_dealers 
            ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, name ASC
        `);
        console.log('Dealers query result:', result);
        return result;
    } catch (error) {
        console.error('Error fetching dealers:', error);
        return { rows: [] };
    }
}

export async function searchDealer(dealerName, password) {
    console.log('Searching for dealer:', dealerName, password);
    console.log('query - ', `
            SELECT id, name, address, phone, email, role, pricing
            FROM phantom_dealers 
            WHERE LOWER(name) LIKE LOWER($1) AND password = $2
            LIMIT 1
        `, [`%${dealerName}%`, `%${password}%`]);
    
    
    try {
        const result = await db.query(`
            SELECT id, name, address, phone, email, role, pricing
            FROM phantom_dealers 
            WHERE LOWER(name) LIKE LOWER($1) AND password = $2
            LIMIT 1
        `, [`%${dealerName}%`, `${password}`]);
        
        console.log('Dealer search result:', result);
        return result[0] || null;
    } catch (error) {
        console.error('Error searching dealer:', error);
        throw error;
    }
}

export async function createDealer(dealerData) {
    const query = `
        INSERT INTO phantom_dealers (
            name,
            phone,
            email,
            address,
            password,
            role,
            gst_no
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, phone, email, address, role, gst_no`;

    const values = [
        dealerData.name,
        dealerData.phone,
        dealerData.email,
        dealerData.address,
        dealerData.password,
        dealerData.role || 'dealer',
        dealerData.gst_no
    ];

    try {
        const result = await db.query(query, values);
        return result[0];
    } catch (error) {
        console.error('Error creating dealer:', error);
        throw error;
    }
}

export async function updateDealerById(dealerId, dealerData) {
    let query = `
        UPDATE phantom_dealers 
        SET 
            name = $1,
            phone = $2,
            email = $3,
            address = $4,
            role = $5,
            gst_no = $6,
            pricing = $7::jsonb`;

    let values = [
        dealerData.name,
        dealerData.phone,
        dealerData.email,
        dealerData.address,
        dealerData.role,
        dealerData.gst_no,
        JSON.stringify(dealerData.pricing || {})
    ];

    // Add password to update only if provided
    if (dealerData.password) {
        query += `, password = $${values.length + 1}`;
        values.push(dealerData.password);
    }

    query += ` WHERE id = $${values.length + 1} 
        RETURNING id, name, phone, email, address, role, gst_no, pricing`;
    values.push(dealerId);

    try {
        const result = await db.query(query, values);
        return result[0];
    } catch (error) {
        console.error('Error updating dealer:', error);
        throw error;
    }
}

export async function deleteDealerById(dealerId) {
    try {
        await db.query('DELETE FROM phantom_dealers WHERE id = $1', [dealerId]);
        return true;
    } catch (error) {
        console.error('Error deleting dealer:', error);
        throw error;
    }
}

export async function getSpecifications() {
    try {
        const result = await db.query('SELECT * FROM phantom_specifications ORDER BY type_name');
        return result;
    } catch (error) {
        console.error('Error fetching specifications:', error);
        return { rows: [] };
    }
}

export async function createSpecification(specData) {
    const query = `
        INSERT INTO phantom_specifications (
            type_name, product_type, fabric_selection, fabric_count, 
            fabric_options, profiles, min_fabric, 
            min_fabric_value, tax
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`;

    const values = [
        specData.type_name,
        specData.product_type,
        specData.fabric_selection,
        specData.fabric_count,
        JSON.stringify(specData.fabric_options || []),
        JSON.stringify(specData.profiles || []),
        specData.min_fabric,
        specData.min_fabric_value,
        specData.tax || 0
    ];

    try {
        const result = await db.query(query, values);
        return result[0];
    } catch (error) {
        console.error('Error creating specification:', error);
        throw error;
    }
}

export async function updateSpecification(id, specData) {
    const query = `
        UPDATE phantom_specifications SET
            type_name = $1,
            product_type = $2,
            fabric_selection = $3,
            fabric_count = $4,
            fabric_options = $5::jsonb,
            profiles = $6::jsonb,
            min_fabric = $7,
            min_fabric_value = $8,
            tax = $9,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *`;

    try {
        const result = await db.query(query, [
            specData.type_name,
            specData.product_type,
            specData.fabric_selection,
            specData.fabric_count,
            JSON.stringify(specData.fabric_options),
            JSON.stringify(specData.profiles),
            specData.min_fabric,
            specData.min_fabric_value,
            specData.tax,
            id
        ]);
        return result[0];
    } catch (error) {
        console.error('Error updating specification:', error);
        throw error;
    }
}

export async function deleteSpecification(id) {
    try {
        await db.query('DELETE FROM phantom_specifications WHERE id = $1', [id]);
        return true;
    } catch (error) {
        console.error('Error deleting specification:', error);
        throw error;
    }
}

