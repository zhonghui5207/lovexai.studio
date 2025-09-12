"use client";

import { Check, Loader } from "lucide-react";
import { PricingItem, Pricing as PricingType } from "@/types/blocks/pricing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";

export default function Pricing({ pricing }: { pricing: PricingType }) {
  if (pricing.disabled) {
    return null;
  }

  const { user, setShowSignModal } = useAppContext();

  const [group, setGroup] = useState(pricing.groups?.[0]?.name);
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleCheckout = async (item: PricingItem, cn_pay: boolean = false) => {
    try {
      if (!user) {
        setShowSignModal(true);
        return;
      }

      const params = {
        product_id: item.product_id,
        product_name: item.product_name,
        credits: item.credits,
        interval: item.interval,
        amount: cn_pay ? item.cn_amount : item.amount,
        currency: cn_pay ? "cny" : item.currency,
        valid_months: item.valid_months,
      };

      setIsLoading(true);
      setProductId(item.product_id);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (response.status === 401) {
        setIsLoading(false);
        setProductId(null);

        setShowSignModal(true);
        return;
      }

      const { code, message, data } = await response.json();
      if (code !== 0) {
        toast.error(message);
        return;
      }

      const { public_key, session_id } = data;

      const stripe = await loadStripe(public_key);
      if (!stripe) {
        toast.error("checkout failed");
        return;
      }

      const result = await stripe.redirectToCheckout({
        sessionId: session_id,
      });

      if (result.error) {
        toast.error(result.error.message);
      }
    } catch (e) {
      console.log("checkout failed: ", e);

      toast.error("checkout failed");
    } finally {
      setIsLoading(false);
      setProductId(null);
    }
  };

  useEffect(() => {
    if (pricing.items) {
      setGroup(pricing.items[0].group);
      setProductId(pricing.items[0].product_id);
      setSelectedItem(pricing.items[0].product_id); // 默认选中第一个
      setIsLoading(false);
    }
  }, [pricing.items]);

  return (
    <section id={pricing.name} className="relative py-24 overflow-hidden">
      <div className="container">
        <div className="mx-auto mb-16 text-center">
          <h2 className="mb-6 text-5xl font-bold lg:text-6xl text-white drop-shadow-2xl">
            {pricing.title}
          </h2>
          <p className="text-white/70 lg:text-xl font-light max-w-2xl mx-auto">
            {pricing.description}
          </p>
        </div>
        <div className="flex flex-col items-center gap-8">
          {pricing.groups && pricing.groups.length > 0 && (
            <div className="flex h-14 mb-8 items-center rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-2 text-lg">
              <RadioGroup
                value={group}
                className={`h-full grid-cols-${pricing.groups.length}`}
                onValueChange={(value) => {
                  setGroup(value);
                }}
              >
                {pricing.groups.map((item, i) => {
                  return (
                    <div
                      key={i}
                      className='h-full rounded-xl transition-all duration-300 has-[button[data-state="checked"]]:bg-gradient-to-r has-[button[data-state="checked"]]:from-blue-500/80 has-[button[data-state="checked"]]:to-purple-500/80'
                    >
                      <RadioGroupItem
                        value={item.name || ""}
                        id={item.name}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={item.name}
                        className="flex h-full cursor-pointer items-center justify-center px-8 font-semibold text-white/70 peer-data-[state=checked]:text-white transition-all duration-300"
                      >
                        {item.title}
                        {item.label && (
                          <Badge
                            variant="outline"
                            className="border-white/30 bg-white/20 px-2 ml-2 text-white backdrop-blur-sm"
                          >
                            {item.label}
                          </Badge>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}
          <div
            className={`md:min-w-96 mt-0 grid gap-6 md:grid-cols-${
              pricing.items?.filter(
                (item) => !item.group || item.group === group
              )?.length
            }`}
          >
            {pricing.items?.map((item, index) => {
              if (item.group && item.group !== group) {
                return null;
              }

              return (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-300 backdrop-blur-sm border ${
                    selectedItem === item.product_id
                      ? "border-emerald-400/50 bg-white/5 shadow-lg shadow-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                  onClick={() => setSelectedItem(item.product_id)}
                >
                  
                  <div className="relative flex h-full flex-col justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        {item.title && (
                          <h3 className="text-2xl font-bold text-white">
                            {item.title}
                          </h3>
                        )}
                        <div className="flex-1"></div>
                        {item.label && (
                          <Badge
                            variant="outline"
                            className="border-white/30 bg-gradient-to-r from-blue-500/80 to-purple-500/80 px-3 py-1 text-white font-medium backdrop-blur-sm"
                          >
                            {item.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-end gap-3 mb-6">
                        {item.original_price && (
                          <span className="text-xl text-white/50 font-semibold line-through">
                            {item.original_price}
                          </span>
                        )}
                        {item.price && (
                          <span className="text-6xl font-bold text-white drop-shadow-lg">
                            {item.price}
                          </span>
                        )}
                        {item.unit && (
                          <span className="block font-semibold text-white/80 text-lg">
                            {item.unit}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-white/70 text-lg font-light leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {item.features_title && (
                        <p className="mb-4 mt-8 font-bold text-white text-lg">
                          {item.features_title}
                        </p>
                      )}
                      {item.features && (
                        <ul className="flex flex-col gap-4">
                          {item.features.map((feature, fi) => {
                            return (
                              <li className="flex gap-3 text-white/80" key={`feature-${fi}`}>
                                <Check className="mt-1 size-5 shrink-0 text-green-400" />
                                <span className="font-medium">{feature}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      {item.cn_amount && item.cn_amount > 0 ? (
                        <div className="flex items-center gap-x-3 mt-4">
                          <span className="text-lg">👉</span>
                          <div
                            className="inline-block p-3 hover:cursor-pointer hover:bg-white/5 rounded-xl transition-all duration-300 border border-white/10 backdrop-blur-sm"
                            onClick={() => {
                              if (isLoading) {
                                return;
                              }
                              handleCheckout(item, true);
                            }}
                          >
                            <img
                              src="/imgs/cnpay.png"
                              alt="cnpay"
                              className="w-24 h-12 rounded-lg"
                            />
                          </div>
                        </div>
                      ) : null}
                      {item.button && (
                        <Button
                          className="w-full flex items-center justify-center gap-3 font-bold text-lg py-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-blue-500/20"
                          disabled={isLoading}
                          onClick={() => {
                            if (isLoading) {
                              return;
                            }
                            handleCheckout(item);
                          }}
                        >
                          {(!isLoading ||
                            (isLoading && productId !== item.product_id)) && (
                            <p>{item.button.title}</p>
                          )}

                          {isLoading && productId === item.product_id && (
                            <p>{item.button.title}</p>
                          )}
                          {isLoading && productId === item.product_id && (
                            <Loader className="mr-2 h-5 w-5 animate-spin" />
                          )}
                          {item.button.icon && (
                            <Icon name={item.button.icon} className="size-5" />
                          )}
                        </Button>
                      )}
                      {item.tip && (
                        <p className="text-white/60 text-sm mt-3 font-light text-center">
                          {item.tip}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
