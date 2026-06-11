// Jest mock for lucide-react — returns a plain <svg> for every named icon export.
// This avoids the ESM parsing issue since lucide-react ships pure ESM.
import React from 'react';

const Icon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} data-testid="icon" {...props} />
);

// Proxy: any named export (ChevronRight, MoreHorizontal, etc.) returns Icon
const handler: ProxyHandler<object> = {
  get: (_target, prop) => {
    if (prop === '__esModule') return true;
    if (prop === 'default') return Icon;
    return Icon;
  },
};

module.exports = new Proxy({}, handler);
