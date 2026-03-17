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

        rankings = []
        for customer in customers:
            uid = customer['customerID']

            inv = investments_table.get_item(Key={'investmentID': uid}).get('Item', {})
            sav = savings_table.get_item(Key={'savingID': uid}).get('Item', {})
            lib = liabilities_table.get_item(Key={'liabilityID': uid}).get('Item', {})

            investments = float(inv.get('amount', 0))
            savings = float(sav.get('amount', 0))
            liabilities = float(lib.get('amount', 0))
            networth = (investments + savings) - liabilities

            rankings.append({
                'name': customer['name'],
                'networth': networth,
            })

        sorted_rankings = sorted(rankings, key=lambda x: x['networth'], reverse=True)

        return jsonify(sorted_rankings), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500


    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']

        inv = investments_table.get_item(Key={'customerID': uid}).get('Item', {})
        sav = savings_table.get_item(Key={'customerID': uid}).get('Item', {})
        lib = liabilities_table.get_item(Key={'customerID': uid}).get('Item', {})

        return jsonify({
            'investments': float(inv.get('amount', 0)),
            'savings': float(sav.get('amount', 0)),
            'liabilities': float(lib.get('amount', 0))
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

        if 'investments' in data:
            investments_table.put_item(Item={
                'investmentID': uid,
                'customerID': uid,
                'amount': str(data['investments'])
            })
        if 'savings' in data:
            savings_table.put_item(Item={
                'savingID': uid,
                'customerID': uid,
                'amount': str(data['savings'])
            })
        if 'liabilities' in data:
            liabilities_table.put_item(Item={
                'liabilityID': uid,
                'customerID': uid,
                'amount': str(data['liabilities'])
            })

        return jsonify({'message': 'Saved successfully'}), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-financials', methods=['GET'])
def get_financials():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']

        inv = investments_table.get_item(Key={'investmentID': uid}).get('Item', {})
        sav = savings_table.get_item(Key={'savingID': uid}).get('Item', {})
        lib = liabilities_table.get_item(Key={'liabilityID': uid}).get('Item', {})

        return jsonify({
            'investments': float(inv.get('amount', 0)),
            'savings': float(sav.get('amount', 0)),
            'liabilities': float(lib.get('amount', 0))
        }), 200

    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000, host='0.0.0.0')