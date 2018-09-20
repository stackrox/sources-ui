import { Route, Switch, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import asyncComponent from './Utilities/asyncComponent';
import some from 'lodash/some';

/**
 * Aysnc imports of components
 *
 * https://webpack.js.org/guides/code-splitting/
 * https://reactjs.org/docs/code-splitting.html
 *
 * pros:
 *      1) code splitting
 *      2) can be used in server-side rendering
 * cons:
 *      1) nameing chunk names adds unnecessary docs to code,
 *         see the difference with DashboardMap and InventoryDeployments.
 *
 */
const Rules = asyncComponent(() => import(/* webpackChunkName: "Rules" */ './PresentationalComponents/Rules/Rules'));
const ProviderPage = asyncComponent(() => import(
    /* webpackChunkName: "ProviderPage" */ './SmartComponents/ProviderPage/ProviderPage'));
const ListingPage = asyncComponent(() => import(
    /* webpackChunkName: "ListingPage" */ './SmartComponents/ListingPage/ListingPage'));
const DetailPage = asyncComponent(() => import(
    /* webpackChunkName: "DetailPage" */ './SmartComponents/DetailPage/DetailPage'));

const paths = {
    providers: '/providers',
    provider_new: '/providers/new',
    vms: '/topologyui/vms',
    provider_detail: '/provider/:id',
    rules: '/topologyui/rules',
};

type Props = {
    childProps: any
};

const InsightsRoute = ({ component: Component, rootClass, ...rest }) => {
    const root = document.getElementById('root');
    root.removeAttribute('class');
    root.classList.add(`page__${rootClass}`);

    return (<Component {...rest} />);
};

InsightsRoute.propTypes = {
    component: PropTypes.func,
    rootClass: PropTypes.string
};

/**
 * the Switch component changes routes depending on the path.
 *
 * Route properties:
 *      exact - path must match exactly,
 *      path - https://prod.foo.redhat.com:1337/insights/advisor/rules
 *      component - component to be rendered when a route has been chosen.
 */
export const Routes = (props: Props) => {
    const path = props.childProps.location.pathname;

    return (
        <Switch>
            {/**<InsightsRoute exact path={paths.providers} component={ProviderPage} rootClass='providers' /> **/}
            <InsightsRoute path={paths.providers} component={ProviderPage} rootClass='providers' />
            <InsightsRoute path={paths.vms} component={ListingPage} rootClass='listing' />
            <InsightsRoute path={paths.provider_detail} component={DetailPage} rootClass='provider' />
            <InsightsRoute path={paths.rules} component={Rules} rootClass='rules' />

            {/* Finally, catch all unmatched routes */}
            <Route render={() => some(paths, p => p === path) ? null : (<Redirect to={paths.providers} />)} />
        </Switch>
    );
};
