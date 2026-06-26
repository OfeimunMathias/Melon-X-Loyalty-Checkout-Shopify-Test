import {
    Banner,
  } from '@shopify/ui-extensions-react/checkout';
import { MelonCoreRedirect } from './MelonRedirect';

  export const MelonCoreNewUser = ({storeName}:{storeName:string}) => {
    return (
      //status="success"
      <Banner title={`You've joined ${storeName} Rewards`}>
        <MelonCoreRedirect NewCustomer />
      </Banner>
    );
  };
