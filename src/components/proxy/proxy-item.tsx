import { useEffect, useState } from "react";
import { useLockFn } from "ahooks";
import { CheckCircleOutlineRounded } from "@mui/icons-material";
import {
  alpha,
  Box,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  SxProps,
  Theme,
} from "@mui/material";
import { BaseLoading } from "@/components/base";
import delayManager from "@/services/delay";
import { useVerge } from "@/hooks/use-verge";

interface Props {
  groupName: string;
  proxy: IProxyItem;
  selected: boolean;
  showType?: boolean;
  sx?: SxProps<Theme>;
  onClick?: (name: string) => void;
}

const Widget = styled(Box)(() => ({
  padding: "3px 6px",
  fontSize: 14,
  borderRadius: "4px",
}));

const TypeBox = styled(Box)(({ theme }) => ({
  display: "inline-block",
  border: "1px solid #ccc",
  borderColor: alpha(theme.palette.text.secondary, 0.36),
  color: alpha(theme.palette.text.secondary, 0.42),
  borderRadius: 4,
  fontSize: 10,
  marginRight: "4px",
  padding: "0 2px",
  lineHeight: 1.25,
}));

export const ProxyItem = (props: Props) => {
  const { groupName, proxy, selected, showType = true, sx, onClick } = props;

  // -1/<=0 为 不显示
  // -2 为 loading
  const [delay, setDelay] = useState(-1);
  const { verge } = useVerge();
  const timeout = verge?.default_latency_timeout || 10000;
  useEffect(() => {
    delayManager.setListener(proxy.name, groupName, setDelay);

    return () => {
      delayManager.removeListener(proxy.name, groupName);
    };
  }, [proxy.name, groupName]);

  useEffect(() => {
    if (!proxy) return;
    setDelay(delayManager.getDelayFix(proxy, groupName));
  }, [proxy]);

  const onDelay = useLockFn(async () => {
    setDelay(-2);
    setDelay(await delayManager.checkDelay(proxy.name, groupName, timeout));
  });

  return (
    <ListItem sx={sx}>
      <ListItemButton
        dense
        selected={selected}
        onClick={() => onClick?.(proxy.name)}
        sx={[
          { borderRadius: 1 },
          ({ palette: { mode, primary } }) => {
            const bgcolor =
              mode === "light"
                ? alpha(primary.main, 0.15)
                : alpha(primary.main, 0.35);
            const color = mode === "light" ? primary.main : primary.light;
            const showDelay = delay > 0;

            return {
              "&:hover .the-check": { display: !showDelay ? "block" : "none" },
              "&:hover .the-delay": { display: showDelay ? "block" : "none" },
              "&:hover .the-icon": { display: "none" },
              "&.Mui-selected": { bgcolor },
              "&.Mui-selected .MuiListItemText-secondary": { color },
            };
          },
        ]}
      >
        <ListItemText
          title={proxy.name}
          secondary={
            <>
              <span style={{ marginRight: 4 }}>
                {proxy.name}
                {showType && proxy.now && ` - ${proxy.now}`}
              </span>
              {showType && !!proxy.provider && (
                <TypeBox component="span">{proxy.provider}</TypeBox>
              )}
              {showType && <TypeBox component="span">{proxy.type}</TypeBox>}
              {showType && proxy.udp && <TypeBox component="span">UDP</TypeBox>}
              {showType && proxy.xudp && (
                <TypeBox component="span">XUDP</TypeBox>
              )}
              {showType && proxy.tfo && <TypeBox component="span">TFO</TypeBox>}
            </>
          }
        />

        <ListItemIcon
          sx={{ justifyContent: "flex-end", color: "primary.main" }}
        >
          {delay === -2 && (
            <Widget>
              <BaseLoading />
            </Widget>
          )}

          {!proxy.provider && delay !== -2 && (
            // provider的节点不支持检测
            <Widget
              className="the-check"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelay();
              }}
              sx={({ palette }) => ({
                display: "none", // hover才显示
                ":hover": { bgcolor: alpha(palette.primary.main, 0.15) },
              })}
            >
              Check
            </Widget>
          )}

          {delay > 0 && (
            // 显示延迟
            <Widget
              className="the-delay"
              onClick={(e) => {
                if (proxy.provider) return;
                e.preventDefault();
                e.stopPropagation();
                onDelay();
              }}
              color={delayManager.formatDelayColor(delay, timeout)}
              sx={({ palette }) =>
                !proxy.provider
                  ? { ":hover": { bgcolor: alpha(palette.primary.main, 0.15) } }
                  : {}
              }
            >
              {delayManager.formatDelay(delay, timeout)}
            </Widget>
          )}

          {delay !== -2 && delay <= 0 && selected && (
            // 展示已选择的icon
            <CheckCircleOutlineRounded
              className="the-icon"
              sx={{ fontSize: 16 }}
            />
          )}
        </ListItemIcon>
      </ListItemButton>
    </ListItem>
  );
};
