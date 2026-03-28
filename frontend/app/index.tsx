import { useState } from "react";
import { Text, View, StyleSheet, Keyboard, KeyboardAvoidingView, TextInput, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseconfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";


export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

const signup = async () => {
  try{
    const user = await createUserWithEmailAndPassword(auth, email, password);
    if (user) router.replace('/signup');
  }
  catch(error){
    console.error(error);
  }
}

const signin = async () => {
  try{
    const user = await signInWithEmailAndPassword(auth, email, password);
    if (user) router.replace('/(tabs)/home');
  }catch(error){
    console.error(error);
  }
}

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"/>
        <Text>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"  
        />
        <Button onPress={signup} title="Sign Up"/>
        <Button onPress={signin} title="Sign In"/>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flex: 1,
    justifyContent: "center",
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4, 
    padding: 10,
    backgroundColor: "#fff",
  }
})