import React, { useState, useCallback, useContext } from "react";
import { ScrollView } from "react-native";
import { View, Button, Text } from "native-base";
import EnvVars from "./EnvVars";
import AppContext from "../AppContext";

const Miscelaneous: React.SFC = () => {
    const { endSession } = useContext(AppContext);

    return (
        <ScrollView >
            <View style={{ padding: 30 }}>
                <Button danger style={{ marginBottom: 30 }} onPress={() => endSession()}>
                    <Text>End Session</Text>
                </Button>
                <EnvVars />
            </View>
        </ScrollView >
    )
}

export default Miscelaneous;