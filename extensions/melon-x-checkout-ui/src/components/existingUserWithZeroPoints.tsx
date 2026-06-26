import { Banner } from "@shopify/ui-extensions-react/checkout"

export const ExistingUserWithZeroPoints = ({storeName}: {storeName:string}) => {
    return (
        <Banner status="success" title="You’ve joined Store Rewards">
       You have no available points in {storeName} Rewards, but you can start earning points from this purchase and future orders.
      </Banner>
    )
}
