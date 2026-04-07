from flask import Flask, jsonify, request
import firebase_admin
from firebase_admin import credentials, auth
import boto3
import uuid


app = Flask(__name__)

# Initialize Firebase Admin SDK
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('Customers')

investments_table = dynamodb.Table('Investments')
savings_table = dynamodb.Table('Savings')
liabilities_table = dynamodb.Table('Liabilities')
investment_items_table = dynamodb.Table('InvestmentItems')
liability_items_table = dynamodb.Table('LiabilityItems')

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

@app.route('/customer', methods=['GET'])
def get_customer():
    # 1. Get token from header
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        # 2. Verify token with Firebase — this is the "check"
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        
        # 3. Query DynamoDB using uid
        response = table.get_item(Key={'customerID': uid})
        customer = response.get('Item')
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
            
        return jsonify(customer), 200
    
    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/create-customer', methods=['POST'])
def create_customer():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    if not token:
        return jsonify({'error': 'No token provided'}), 401

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']

        data = request.get_json()

        table.put_item(Item={
            'customerID': uid,
            'name': data['name'],
            'networth_goal': data['networth_goal'],
            'networth_goal_date': data['networth_goal_date']
        })

        return jsonify({'message': 'Customer created'}), 201

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/rankings', methods=['GET'])
def get_rankings():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401

    try:
        auth.verify_id_token(token)

        customers = table.scan().get('Items', [])
        customers = [c for c in customers if c.get('in_rankings') == True]

        # Scan all items tables once
        all_investments = investment_items_table.scan().get('Items', [])
        all_savings = savings_table.scan().get('Items', [])
        all_liabilities = liability_items_table.scan().get('Items', [])

        rankings = []

        for customer in customers:
            uid = customer['customerID']
            goal = float(customer.get('networth_goal', 1))

            # Find all months this user has investment data for
            user_inv = [i for i in all_investments if i.get('customerID') == uid]
            user_sav = [s for s in all_savings if s.get('customerID') == uid]
            user_lib = [l for l in all_liabilities if l.get('customerID') == uid]

            # Get all months that have any data
            months_with_data = set()
            for i in user_inv:
                months_with_data.add(i.get('month'))
            for s in user_sav:
                key = s.get('savingID', '')
                month = key.replace(f"{uid}_", '') if key.startswith(uid) else None
                if month:
                    months_with_data.add(month)
            for l in user_lib:
                months_with_data.add(l.get('month'))

            # Remove None
            months_with_data = {m for m in months_with_data if m and m in MONTHS}

            if not months_with_data:
                continue

            # Pick the most recent month
            latest_month = max(months_with_data, key=lambda m: MONTHS.index(m))

            # Calculate networth for that month
            inv_total = sum(float(i.get('amount', 0)) for i in user_inv if i.get('month') == latest_month)

            sav_item = next((s for s in user_sav if s.get('savingID') == f"{uid}_{latest_month}"), {})
            sav_total = float(sav_item.get('amount', 0))

            lib_total = sum(float(l.get('amount', 0)) for l in user_lib if l.get('month') == latest_month)

            networth = (inv_total + sav_total) - lib_total
            goal_percent = round((networth / goal) * 100, 1) if goal > 0 else 0

            rankings.append({
                'name': customer['name'],
                'networth': networth,
                'networth_goal': goal,
                'goal_percent': goal_percent,
                'month': latest_month
            })

        sorted_rankings = sorted(rankings, key=lambda x: x['goal_percent'], reverse=True)

        return jsonify(sorted_rankings), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        print('ERROR:', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/get-financials', methods=['GET'])
def get_financials():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        month = request.args.get('month')  # e.g. "2025-04"
        if not month:
            return jsonify({'error': 'Month required'}), 400

        key = f"{uid}_{month}"

        inv = investments_table.get_item(Key={'investmentID': key}).get('Item', {})
        sav = savings_table.get_item(Key={'savingID': key}).get('Item', {})
        lib = liabilities_table.get_item(Key={'liabilityID': key}).get('Item', {})

        return jsonify({
            'investments': inv.get('amount', ''),
            'savings': sav.get('amount', ''),
            'liabilities': lib.get('amount', '')
        }), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save-financials', methods=['POST'])
def save_financials():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        data = request.get_json()
        month = data.get('month')
        if not month:
            return jsonify({'error': 'Month required'}), 400

        key = f"{uid}_{month}"

        if 'investments' in data:
            investments_table.put_item(Item={
                'investmentID': key,
                'customerID': uid,
                'amount': str(data['investments'])
            })
        if 'savings' in data:
            savings_table.put_item(Item={
                'savingID': key,
                'customerID': uid,
                'amount': str(data['savings'])
            })
        if 'liabilities' in data:
            liabilities_table.put_item(Item={
                'liabilityID': key,
                'customerID': uid,
                'amount': str(data['liabilities'])
            })

        return jsonify({'message': 'Saved successfully'}), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/update-customer', methods=['POST'])
def update_customer():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        data = request.get_json()

        update_expr = 'SET '
        expr_values = {}
        parts = []

        if 'networth_goal' in data:
            parts.append('networth_goal = :g')
            expr_values[':g'] = data['networth_goal']
        if 'name' in data:
            parts.append('#n = :n')
            expr_values[':n'] = data['name']
        if 'in_rankings' in data:
            parts.append('in_rankings = :r')
            expr_values[':r'] = data['in_rankings']

        update_expr += ', '.join(parts)

        kwargs = {
            'Key': {'customerID': uid},
            'UpdateExpression': update_expr,
            'ExpressionAttributeValues': expr_values,
        }
        if 'name' in data:
            kwargs['ExpressionAttributeNames'] = {'#n': 'name'}

        table.update_item(**kwargs)
        return jsonify({'message': 'Updated successfully'}), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        print('ERROR:', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/investment-items', methods=['GET'])
def get_investment_items():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        month = request.args.get('month')
        if not month:
            return jsonify({'error': 'Month required'}), 400

        result = investment_items_table.scan(
            FilterExpression='customerID = :uid AND #m = :month',
            ExpressionAttributeNames={'#m': 'month'},
            ExpressionAttributeValues={':uid': uid, ':month': month}
        )
        return jsonify(result.get('Items', [])), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/investment-items', methods=['POST'])
def save_investment_item():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        data = request.get_json()

        item_id = data.get('itemID', f"{uid}_{data['month']}_{uuid.uuid4().hex[:8]}")

        investment_items_table.put_item(Item={
            'ItemID': item_id,
            'customerID': uid,
            'month': data['month'],
            'name': data['name'],
            'amount': str(data['amount'])
        })

        return jsonify({'itemID': item_id}), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        print('ERROR:', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/investment-items/<item_id>', methods=['DELETE'])
def delete_investment_item(item_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        auth.verify_id_token(token)
        investment_items_table.delete_item(Key={'ItemID': item_id})
        return jsonify({'message': 'Deleted'}), 200
    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/liability-items', methods=['GET'])
def get_liability_items():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        month = request.args.get('month')
        if not month:
            return jsonify({'error': 'Month required'}), 400

        result = liability_items_table.scan(
            FilterExpression='customerID = :uid AND #m = :month',
            ExpressionAttributeNames={'#m': 'month'},
            ExpressionAttributeValues={':uid': uid, ':month': month}
        )
        return jsonify(result.get('Items', [])), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/liability-items', methods=['POST'])
def save_liability_item():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        data = request.get_json()

        item_id = data.get('itemID', f"{uid}_{data['month']}_{uuid.uuid4().hex[:8]}")

        liability_items_table.put_item(Item={
            'itemID': item_id,
            'customerID': uid,
            'month': data['month'],
            'name': data['name'],
            'amount': str(data['amount'])
        })

        return jsonify({'itemID': item_id}), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        print('ERROR:', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/liability-items/<item_id>', methods=['DELETE'])
def delete_liability_item(item_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        auth.verify_id_token(token)
        liability_items_table.delete_item(Key={'itemID': item_id})
        return jsonify({'message': 'Deleted'}), 200
    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/networth-history', methods=['GET'])
def get_networth_history():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']

        all_investments = investment_items_table.scan().get('Items', [])
        all_savings = savings_table.scan().get('Items', [])
        all_liabilities = liability_items_table.scan().get('Items', [])

        user_inv = [i for i in all_investments if i.get('customerID') == uid]
        user_sav = [s for s in all_savings if s.get('customerID') == uid]
        user_lib = [l for l in all_liabilities if l.get('customerID') == uid]

        months_with_data = set()
        for i in user_inv:
            months_with_data.add(i.get('month'))
        for s in user_sav:
            key = s.get('savingID', '')
            month = key.replace(f"{uid}_", '') if key.startswith(uid) else None
            if month:
                months_with_data.add(month)
        for l in user_lib:
            months_with_data.add(l.get('month'))

        months_with_data = {m for m in months_with_data if m and m in MONTHS}

        history = []
        for month in MONTHS:
            if month not in months_with_data:
                continue

            inv_total = sum(float(i.get('amount', 0)) for i in user_inv if i.get('month') == month)
            sav_item = next((s for s in user_sav if s.get('savingID') == f"{uid}_{month}"), {})
            sav_total = float(sav_item.get('amount', 0))
            lib_total = sum(float(l.get('amount', 0)) for l in user_lib if l.get('month') == month)

            history.append({
                'month': month,
                'investments': inv_total,
                'savings': sav_total,
                'liabilities': lib_total,
                'networth': (inv_total + sav_total) - lib_total
            })

        return jsonify(history), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        print('ERROR:', str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000, host='0.0.0.0')