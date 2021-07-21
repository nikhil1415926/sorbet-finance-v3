import React from 'react';
import { TYPE } from 'theme';
import BackBtn from '../../components/BackBtn/BackBtn';

const PoolOverview : React.FC = () => {
  return (
    <>
      <BackBtn to='/pools' />
      <TYPE.heading1 mb={3} style={{textAlign: 'center'}}>USDC/DAI Pool Overview</TYPE.heading1>
    </>
  )
};

export default PoolOverview;