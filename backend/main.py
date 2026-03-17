import boto3

# client = boto3.client('dynamodb')
client = boto3.resource('dynamodb', 
                        region_name='us-east-2' )
table = client.Table('Customers')

table.put_item(Item={'customerID': 'user_002',
                     'name': 'john doe',
                     'networh_goal': 1000,
                     'networth_goal_date': '01-02-2027'})

