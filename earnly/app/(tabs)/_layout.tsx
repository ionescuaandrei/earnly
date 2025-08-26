// Removed unused imports
import { COLORS } from '@/constants/Colors';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import React from 'react';

const TabLayout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: true,
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    position: 'absolute',
                    elevation: 0,
                    height: 60,
                },
            }}>
                <Tabs.Screen
                    name="index" 
                    options={{ 
                        headerShown: false, 
                        tabBarIcon: ({size,color}: {size: number, color: string}) => <AntDesign name="form" size={size} color={color} />, 
                        tabBarLabel: "Surveys",
                    }} 
                />
                <Tabs.Screen 
                    name="rewards" 
                    options={{ 
                        headerShown: false ,
                        tabBarIcon: ({size, color}: {size: number; color: string}) => <MaterialCommunityIcons name="gift-open-outline" size={size} color={color} />,
                        tabBarLabel: "Rewards",
                    }}/>
                <Tabs.Screen 
                    name="profile" 
                    options={{ 
                        headerShown: false ,
                        tabBarIcon: ({size, color}: {size: number; color: string}) => <AntDesign name="user" size={size} color={color} />,
                        tabBarLabel: "Profile",
                    }} 
                />
        </Tabs>
    )
}

export default TabLayout