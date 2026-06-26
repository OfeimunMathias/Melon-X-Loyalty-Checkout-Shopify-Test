import { Banner } from "@shopify/ui-extensions-react/checkout"

export const Joined = ({storeName}: {storeName:string}) => {
    return (
     <>
    <Banner status="success" title={`You’ve joined ${storeName} Rewards`}>
       You’ll earn points from this purchase and future orders.
     </Banner>
     </>
    )
}
