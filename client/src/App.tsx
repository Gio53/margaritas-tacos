import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { OrdersProvider } from "./contexts/OrdersContext";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import TestOrder from "./pages/TestOrder";
import ReceiptLayoutPreview from "./pages/ReceiptLayoutPreview";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/order"} component={Order} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/test-order"} component={TestOrder} />
      <Route path={"/receipt-preview"} component={ReceiptLayoutPreview} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <OrdersProvider>
            <TooltipProvider>
            <Toaster />
            <Router />
            </TooltipProvider>
          </OrdersProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
