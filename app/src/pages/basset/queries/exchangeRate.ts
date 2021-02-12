import { DateTime, Ratio, uLuna } from '@anchor-protocol/notation';
import { createMap, useMap } from '@anchor-protocol/use-map';
import { gql, useQuery } from '@apollo/client';
import { useAddressProvider } from 'contexts/contract';
import { parseResult } from 'queries/parseResult';
import { MappedQueryResult } from 'queries/types';
import { useRefetch } from 'queries/useRefetch';
import { useMemo } from 'react';

export interface RawData {
  exchangeRate: {
    Result: string;
  };
}

export interface Data {
  exchangeRate: {
    Result: string;
    actual_unbonded_amount: uLuna<string>;
    exchange_rate: Ratio<string>;
    last_index_modification: DateTime;
    last_processed_batch: number;
    last_unbonded_time: DateTime;
    prev_hub_balance: uLuna<string>;
    total_bond_amount: uLuna<string>;
  };
}

export const dataMap = createMap<RawData, Data>({
  exchangeRate: (existing, { exchangeRate }) => {
    return parseResult(existing.exchangeRate, exchangeRate.Result);
  },
});

export interface RawVariables {
  bLunaHubContract: string;
  stateQuery: string;
}

export interface Variables {
  bLunaHubContract: string;
  stateQuery?: {
    state: {};
  };
}

export function mapVariables({
  bLunaHubContract,
  stateQuery = { state: {} },
}: Variables): RawVariables {
  return {
    bLunaHubContract,
    stateQuery: JSON.stringify(stateQuery),
  };
}

export const query = gql`
  query bLunaExchangeRate($bLunaHubContract: String!, $stateQuery: String!) {
    exchangeRate: WasmContractsContractAddressStore(
      ContractAddress: $bLunaHubContract
      QueryMsg: $stateQuery
    ) {
      Result
    }
  }
`;

export function useExchangeRate({
  bAsset,
}: {
  bAsset: string;
}): MappedQueryResult<RawVariables, RawData, Data> {
  const addressProvider = useAddressProvider();

  const variables = useMemo(() => {
    return mapVariables({
      bLunaHubContract: addressProvider.bAssetHub(bAsset),
      stateQuery: {
        state: {},
      },
    });
  }, [addressProvider, bAsset]);

  const { data: _data, refetch: _refetch, ...result } = useQuery<
    RawData,
    RawVariables
  >(query, {
    fetchPolicy: 'network-only',
    variables,
  });

  const data = useMap(_data, dataMap);
  const refetch = useRefetch(_refetch, dataMap);

  return {
    ...result,
    data,
    refetch,
  };
}
