#  $pendora - cse-3311-Team 01
$pendora is a budgeting app built for college students to track their financial goals without linking bank accounts.Instead of tracking every transaction, users manually input their investments, savings, and liabilities each month. The app then calculates net worth automatically and displays progress through charts and graphs.


## Features
- Firebase Authentication (Sign Up / Sign In)
- Home Screen with net worth calculation and monthly selection
- Manage Investments, Savings, and Liabilities
- Monthly net worth history with stacked bar graph
- Recurring investment entries (e.g. 401k auto-rollover)
- Opt-in ranking system based on goal completion percentage
- Profile page to update financial goals
- Investment growth chart

## Tech Stack
- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Python, Flask
- **Database**: AWS DynamoDB
- **Authentication**: Firebase

### Frontend Setup
```bash
cd frontend
npm install
npx expo start 
```
> Must have **Expo Go** app on your phone

### Backend Setup
```bash
cd backend
python app.py
```

### Environment Setup
Then create a `.env` file and add the key:
```
FIREBASE_API_KEY=the-actual-api-key
