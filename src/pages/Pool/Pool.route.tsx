import React from "react";
import {
  Switch,
  Route,
  useRouteMatch
} from "react-router-dom";
import PoolLayout  from "./components/PoolLayout";
import PoolList from './module/PoolList';
import PoolOverview from './module/PoolOverview';

function PoolRoute() {
  const { path } = useRouteMatch();

  return (
    <PoolLayout>
      <Switch>
        <Route exact path={path} component={PoolList} />
        <Route path={`${path}/:topicId`} component={PoolOverview} />
        {/* <Route exact strict path="/pools/:address/add" component={AddLiquidity} /> */}
        {/* <Route exact strict path="/pools/:address/remove" component={RemoveLiquidity} /> */}
      </Switch>
    </PoolLayout>
  );
}

export default PoolRoute;