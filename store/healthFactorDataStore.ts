import React from "react";
import { hookstate, State } from "@hookstate/core";
import { HealthFactorData } from "../hooks/useAaveData";

interface HealthFactorStore {
  currentAddress: string;
  currentMarket: string;
  addressData: Record<string, Record<string, HealthFactorData>>;
}

const defaultState: HealthFactorStore = {
  currentAddress: "",
  currentMarket: "HYDRATION",
  addressData: {},
};

export const HealthFactorDataStore: HealthFactorStore = hookstate(defaultState);
