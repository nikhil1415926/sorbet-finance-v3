//import { useGUniFactoryContract } from 'hooks/useContract'
import React, { useState, useEffect} from 'react'
import styled from "styled-components";
import { PoolInfo as PoolInfoInterface } from '../../state/pool/reducer';
import PoolInfo from '../../components/PoolInfo';
import { usePool } from '../../state/pool/hooks';
import { ButtonPink } from 'components/Button'
import { useActiveWeb3React } from 'hooks/web3'
import {fetchPools} from '../../state/pool/hooks'

export type PoolParam = {
  address: string;
}

const Button = styled(ButtonPink)`
  width: 50%;
`

export const Box = styled.div`
  dispaly: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.bg0};
  border-radius: 1.5rem;
  min-width: 500px;
  box-shadow: rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px;
  @media only screen and (max-width: 500px) {
    min-width: 300px;
    width: 100%;
  }
`;

export const Title = styled.p`
  font-weight: 800;
  margin-left: 5%;
`;

const List = styled.ul`
  margin: 1rem;
  padding: 0 0.25rem 0.25rem 0.25rem;
  @media only screen and (max-width: 500px) {
    padding: 0 0.05rem 0.05rem 0.05rem;
  }
`;

const Outer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`

const featuredPools = [
  '0xAbDDAfB225e10B90D798bB8A886238Fb835e2053'.toLowerCase(),
  '0x4f38892c16bfbB4f4f7424EEfAa9767F4E922073'.toLowerCase(),
  '0xe668FE99123b3E901872A8c310eC2FA076E49fc1'.toLowerCase()
]

export default function ListPools() {
  const [poolsData, setPoolsData] = usePool();
  // const [poolsData, setPoolsData] = useState<any[]>([]);
  const [featuredPoolsData, setFeaturedPoolsData] = useState<any[]>([]);
  const [showAll, setShowAll] = useState<boolean>(false);
  const { chainId } = useActiveWeb3React()
  useEffect(() => {
    const createFeaturedPools = (allPools: Array<PoolInfoInterface>) => {
      const featured = [];
      const rest = [];
      for (let i=0; i<featuredPools.length; i++) {
        for (let j=0; j<allPools.length; j++) {
          if (featuredPools[i] == allPools[j].address.toLowerCase()) {
            featured.push(allPools[j])
          } else if (i==0 && !featuredPools.includes(allPools[j].address.toLowerCase())) {
            rest.push(allPools[j])
          }
        }
      }
      setFeaturedPoolsData(featured);
    }
    console.log("fetching pools...")
    fetchPools().then((result) => {
      const data = [...result];
      createFeaturedPools([...result]);
      setPoolsData(data);
    });
  }, [setPoolsData]);
  return (
    <>
    {Number(chainId) == 1 ?
      <Box>
        <Title>G-UNI Pools</Title>
        {featuredPoolsData.length > 0 && poolsData.length > 0 ?
          <Outer>
            <List>
              {featuredPoolsData.map(function(poolData, index){
                return <PoolInfo key={index} poolData={poolData} />;
              })}
            </List>
          {showAll ?
            <List>
            {poolsData.map(function(poolData, index){
              if (!featuredPools.includes(poolData.address.toLowerCase())) {
                return <PoolInfo key={index} poolData={poolData} />;
              } else {
                return <p key={index}></p>
              }
            })}
            </List>
          :
            <>
            </>
          }
          <Button onClick={() => setShowAll(!showAll)}>{showAll ? 'Show Less':'Show All'}</Button>
          <br></br>
          </Outer>
        :
          <Outer>
            {Number(chainId) == 1 ?
              <></>
            :
              <p>WRONG NETWORK</p>
            }
          </Outer>
        }
      </Box>
    :
      <p>WRONG NETWORK</p>
    }
    </>
  )
}
