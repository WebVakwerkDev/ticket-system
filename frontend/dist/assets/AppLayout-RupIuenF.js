import{B as ne,o as a,c,a as s,m as l,_ as ce,l as ue,T as h,h as de,i as m,j as w,F as P,t as y,f as I,n as fe,b as me,k as S,p as C,q as k,s as pe,x as oe,C as L,y as _,z as $,A as v,d as ge,u as be,D as A,r as ye,E as B,G as he}from"./index-Dvcvi4Qn.js";import{s as K,a as ve,R as Ce,b as we,c as W,f as re,x as z}from"./index-BGazXh2g.js";import{s as J}from"./index-D47PhKcA.js";import{s as ke,a as Ie}from"./index-Cg2JQ-bp.js";var Se=`
    .p-toast {
        width: dt('toast.width');
        white-space: pre-line;
        word-break: break-word;
    }

    .p-toast-message {
        margin: 0 0 1rem 0;
        display: grid;
        grid-template-rows: 1fr;
    }

    .p-toast-message-icon {
        flex-shrink: 0;
        font-size: dt('toast.icon.size');
        width: dt('toast.icon.size');
        height: dt('toast.icon.size');
    }

    .p-toast-message-content {
        display: flex;
        align-items: flex-start;
        padding: dt('toast.content.padding');
        gap: dt('toast.content.gap');
        min-height: 0;
        overflow: hidden;
        transition: padding 250ms ease-in;
    }

    .p-toast-message-text {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: dt('toast.text.gap');
    }

    .p-toast-summary {
        font-weight: dt('toast.summary.font.weight');
        font-size: dt('toast.summary.font.size');
    }

    .p-toast-detail {
        font-weight: dt('toast.detail.font.weight');
        font-size: dt('toast.detail.font.size');
    }

    .p-toast-close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        cursor: pointer;
        background: transparent;
        transition:
            background dt('toast.transition.duration'),
            color dt('toast.transition.duration'),
            outline-color dt('toast.transition.duration'),
            box-shadow dt('toast.transition.duration');
        outline-color: transparent;
        color: inherit;
        width: dt('toast.close.button.width');
        height: dt('toast.close.button.height');
        border-radius: dt('toast.close.button.border.radius');
        margin: -25% 0 0 0;
        right: -25%;
        padding: 0;
        border: none;
        user-select: none;
    }

    .p-toast-close-button:dir(rtl) {
        margin: -25% 0 0 auto;
        left: -25%;
        right: auto;
    }

    .p-toast-message-info,
    .p-toast-message-success,
    .p-toast-message-warn,
    .p-toast-message-error,
    .p-toast-message-secondary,
    .p-toast-message-contrast {
        border-width: dt('toast.border.width');
        border-style: solid;
        backdrop-filter: blur(dt('toast.blur'));
        border-radius: dt('toast.border.radius');
    }

    .p-toast-close-icon {
        font-size: dt('toast.close.icon.size');
        width: dt('toast.close.icon.size');
        height: dt('toast.close.icon.size');
    }

    .p-toast-close-button:focus-visible {
        outline-width: dt('focus.ring.width');
        outline-style: dt('focus.ring.style');
        outline-offset: dt('focus.ring.offset');
    }

    .p-toast-message-info {
        background: dt('toast.info.background');
        border-color: dt('toast.info.border.color');
        color: dt('toast.info.color');
        box-shadow: dt('toast.info.shadow');
    }

    .p-toast-message-info .p-toast-detail {
        color: dt('toast.info.detail.color');
    }

    .p-toast-message-info .p-toast-close-button:focus-visible {
        outline-color: dt('toast.info.close.button.focus.ring.color');
        box-shadow: dt('toast.info.close.button.focus.ring.shadow');
    }

    .p-toast-message-info .p-toast-close-button:hover {
        background: dt('toast.info.close.button.hover.background');
    }

    .p-toast-message-success {
        background: dt('toast.success.background');
        border-color: dt('toast.success.border.color');
        color: dt('toast.success.color');
        box-shadow: dt('toast.success.shadow');
    }

    .p-toast-message-success .p-toast-detail {
        color: dt('toast.success.detail.color');
    }

    .p-toast-message-success .p-toast-close-button:focus-visible {
        outline-color: dt('toast.success.close.button.focus.ring.color');
        box-shadow: dt('toast.success.close.button.focus.ring.shadow');
    }

    .p-toast-message-success .p-toast-close-button:hover {
        background: dt('toast.success.close.button.hover.background');
    }

    .p-toast-message-warn {
        background: dt('toast.warn.background');
        border-color: dt('toast.warn.border.color');
        color: dt('toast.warn.color');
        box-shadow: dt('toast.warn.shadow');
    }

    .p-toast-message-warn .p-toast-detail {
        color: dt('toast.warn.detail.color');
    }

    .p-toast-message-warn .p-toast-close-button:focus-visible {
        outline-color: dt('toast.warn.close.button.focus.ring.color');
        box-shadow: dt('toast.warn.close.button.focus.ring.shadow');
    }

    .p-toast-message-warn .p-toast-close-button:hover {
        background: dt('toast.warn.close.button.hover.background');
    }

    .p-toast-message-error {
        background: dt('toast.error.background');
        border-color: dt('toast.error.border.color');
        color: dt('toast.error.color');
        box-shadow: dt('toast.error.shadow');
    }

    .p-toast-message-error .p-toast-detail {
        color: dt('toast.error.detail.color');
    }

    .p-toast-message-error .p-toast-close-button:focus-visible {
        outline-color: dt('toast.error.close.button.focus.ring.color');
        box-shadow: dt('toast.error.close.button.focus.ring.shadow');
    }

    .p-toast-message-error .p-toast-close-button:hover {
        background: dt('toast.error.close.button.hover.background');
    }

    .p-toast-message-secondary {
        background: dt('toast.secondary.background');
        border-color: dt('toast.secondary.border.color');
        color: dt('toast.secondary.color');
        box-shadow: dt('toast.secondary.shadow');
    }

    .p-toast-message-secondary .p-toast-detail {
        color: dt('toast.secondary.detail.color');
    }

    .p-toast-message-secondary .p-toast-close-button:focus-visible {
        outline-color: dt('toast.secondary.close.button.focus.ring.color');
        box-shadow: dt('toast.secondary.close.button.focus.ring.shadow');
    }

    .p-toast-message-secondary .p-toast-close-button:hover {
        background: dt('toast.secondary.close.button.hover.background');
    }

    .p-toast-message-contrast {
        background: dt('toast.contrast.background');
        border-color: dt('toast.contrast.border.color');
        color: dt('toast.contrast.color');
        box-shadow: dt('toast.contrast.shadow');
    }
    
    .p-toast-message-contrast .p-toast-detail {
        color: dt('toast.contrast.detail.color');
    }

    .p-toast-message-contrast .p-toast-close-button:focus-visible {
        outline-color: dt('toast.contrast.close.button.focus.ring.color');
        box-shadow: dt('toast.contrast.close.button.focus.ring.shadow');
    }

    .p-toast-message-contrast .p-toast-close-button:hover {
        background: dt('toast.contrast.close.button.hover.background');
    }

    .p-toast-top-center {
        transform: translateX(-50%);
    }

    .p-toast-bottom-center {
        transform: translateX(-50%);
    }

    .p-toast-center {
        min-width: 20vw;
        transform: translate(-50%, -50%);
    }

    .p-toast-message-enter-active {
        animation: p-animate-toast-enter 300ms ease-out;
    }

    .p-toast-message-leave-active {
        animation: p-animate-toast-leave 250ms ease-in;
    }

    .p-toast-message-leave-to .p-toast-message-content {
        padding-top: 0;
        padding-bottom: 0;
    }

    @keyframes p-animate-toast-enter {
        from {
            opacity: 0;
            transform: scale(0.6);
        }
        to {
            opacity: 1;
            grid-template-rows: 1fr;
        }
    }

     @keyframes p-animate-toast-leave {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
            margin-bottom: 0;
            grid-template-rows: 0fr;
            transform: translateY(-100%) scale(0.6);
        }
    }
`;function x(e){"@babel/helpers - typeof";return x=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},x(e)}function D(e,t,n){return(t=je(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function je(e){var t=Ae(e,"string");return x(t)=="symbol"?t:t+""}function Ae(e,t){if(x(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(x(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}var Pe={root:function(t){var n=t.position;return{position:"fixed",top:n==="top-right"||n==="top-left"||n==="top-center"?"20px":n==="center"?"50%":null,right:(n==="top-right"||n==="bottom-right")&&"20px",bottom:(n==="bottom-left"||n==="bottom-right"||n==="bottom-center")&&"20px",left:n==="top-left"||n==="bottom-left"?"20px":n==="center"||n==="top-center"||n==="bottom-center"?"50%":null}}},xe={root:function(t){var n=t.props;return["p-toast p-component p-toast-"+n.position]},message:function(t){var n=t.props;return["p-toast-message",{"p-toast-message-info":n.message.severity==="info"||n.message.severity===void 0,"p-toast-message-warn":n.message.severity==="warn","p-toast-message-error":n.message.severity==="error","p-toast-message-success":n.message.severity==="success","p-toast-message-secondary":n.message.severity==="secondary","p-toast-message-contrast":n.message.severity==="contrast"}]},messageContent:"p-toast-message-content",messageIcon:function(t){var n=t.props;return["p-toast-message-icon",D(D(D(D({},n.infoIcon,n.message.severity==="info"),n.warnIcon,n.message.severity==="warn"),n.errorIcon,n.message.severity==="error"),n.successIcon,n.message.severity==="success")]},messageText:"p-toast-message-text",summary:"p-toast-summary",detail:"p-toast-detail",closeButton:"p-toast-close-button",closeIcon:"p-toast-close-icon"},Ee=ne.extend({name:"toast",style:Se,classes:xe,inlineStyles:Pe}),F={name:"ExclamationTriangleIcon",extends:K};function Te(e){return $e(e)||Le(e)||Me(e)||Oe()}function Oe(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Me(e,t){if(e){if(typeof e=="string")return N(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?N(e,t):void 0}}function Le(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function $e(e){if(Array.isArray(e))return N(e)}function N(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,o=Array(t);n<t;n++)o[n]=e[n];return o}function Be(e,t,n,o,i,r){return a(),c("svg",l({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},e.pti()),Te(t[0]||(t[0]=[s("path",{d:"M13.4018 13.1893H0.598161C0.49329 13.189 0.390283 13.1615 0.299143 13.1097C0.208003 13.0578 0.131826 12.9832 0.0780112 12.8932C0.0268539 12.8015 0 12.6982 0 12.5931C0 12.4881 0.0268539 12.3848 0.0780112 12.293L6.47985 1.08982C6.53679 1.00399 6.61408 0.933574 6.70484 0.884867C6.7956 0.836159 6.897 0.810669 7 0.810669C7.103 0.810669 7.2044 0.836159 7.29516 0.884867C7.38592 0.933574 7.46321 1.00399 7.52015 1.08982L13.922 12.293C13.9731 12.3848 14 12.4881 14 12.5931C14 12.6982 13.9731 12.8015 13.922 12.8932C13.8682 12.9832 13.792 13.0578 13.7009 13.1097C13.6097 13.1615 13.5067 13.189 13.4018 13.1893ZM1.63046 11.989H12.3695L7 2.59425L1.63046 11.989Z",fill:"currentColor"},null,-1),s("path",{d:"M6.99996 8.78801C6.84143 8.78594 6.68997 8.72204 6.57787 8.60993C6.46576 8.49782 6.40186 8.34637 6.39979 8.18784V5.38703C6.39979 5.22786 6.46302 5.0752 6.57557 4.96265C6.68813 4.85009 6.84078 4.78686 6.99996 4.78686C7.15914 4.78686 7.31179 4.85009 7.42435 4.96265C7.5369 5.0752 7.60013 5.22786 7.60013 5.38703V8.18784C7.59806 8.34637 7.53416 8.49782 7.42205 8.60993C7.30995 8.72204 7.15849 8.78594 6.99996 8.78801Z",fill:"currentColor"},null,-1),s("path",{d:"M6.99996 11.1887C6.84143 11.1866 6.68997 11.1227 6.57787 11.0106C6.46576 10.8985 6.40186 10.7471 6.39979 10.5885V10.1884C6.39979 10.0292 6.46302 9.87658 6.57557 9.76403C6.68813 9.65147 6.84078 9.58824 6.99996 9.58824C7.15914 9.58824 7.31179 9.65147 7.42435 9.76403C7.5369 9.87658 7.60013 10.0292 7.60013 10.1884V10.5885C7.59806 10.7471 7.53416 10.8985 7.42205 11.0106C7.30995 11.1227 7.15849 11.1866 6.99996 11.1887Z",fill:"currentColor"},null,-1)])),16)}F.render=Be;var Z={name:"InfoCircleIcon",extends:K};function De(e){return Fe(e)||ze(e)||_e(e)||Re()}function Re(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function _e(e,t){if(e){if(typeof e=="string")return U(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?U(e,t):void 0}}function ze(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function Fe(e){if(Array.isArray(e))return U(e)}function U(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,o=Array(t);n<t;n++)o[n]=e[n];return o}function Ne(e,t,n,o,i,r){return a(),c("svg",l({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},e.pti()),De(t[0]||(t[0]=[s("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M3.11101 12.8203C4.26215 13.5895 5.61553 14 7 14C8.85652 14 10.637 13.2625 11.9497 11.9497C13.2625 10.637 14 8.85652 14 7C14 5.61553 13.5895 4.26215 12.8203 3.11101C12.0511 1.95987 10.9579 1.06266 9.67879 0.532846C8.3997 0.00303296 6.99224 -0.13559 5.63437 0.134506C4.2765 0.404603 3.02922 1.07129 2.05026 2.05026C1.07129 3.02922 0.404603 4.2765 0.134506 5.63437C-0.13559 6.99224 0.00303296 8.3997 0.532846 9.67879C1.06266 10.9579 1.95987 12.0511 3.11101 12.8203ZM3.75918 2.14976C4.71846 1.50879 5.84628 1.16667 7 1.16667C8.5471 1.16667 10.0308 1.78125 11.1248 2.87521C12.2188 3.96918 12.8333 5.45291 12.8333 7C12.8333 8.15373 12.4912 9.28154 11.8502 10.2408C11.2093 11.2001 10.2982 11.9478 9.23232 12.3893C8.16642 12.8308 6.99353 12.9463 5.86198 12.7212C4.73042 12.4962 3.69102 11.9406 2.87521 11.1248C2.05941 10.309 1.50384 9.26958 1.27876 8.13803C1.05367 7.00647 1.16919 5.83358 1.61071 4.76768C2.05222 3.70178 2.79989 2.79074 3.75918 2.14976ZM7.00002 4.8611C6.84594 4.85908 6.69873 4.79698 6.58977 4.68801C6.48081 4.57905 6.4187 4.43185 6.41669 4.27776V3.88888C6.41669 3.73417 6.47815 3.58579 6.58754 3.4764C6.69694 3.367 6.84531 3.30554 7.00002 3.30554C7.15473 3.30554 7.3031 3.367 7.4125 3.4764C7.52189 3.58579 7.58335 3.73417 7.58335 3.88888V4.27776C7.58134 4.43185 7.51923 4.57905 7.41027 4.68801C7.30131 4.79698 7.1541 4.85908 7.00002 4.8611ZM7.00002 10.6945C6.84594 10.6925 6.69873 10.6304 6.58977 10.5214C6.48081 10.4124 6.4187 10.2652 6.41669 10.1111V6.22225C6.41669 6.06754 6.47815 5.91917 6.58754 5.80977C6.69694 5.70037 6.84531 5.63892 7.00002 5.63892C7.15473 5.63892 7.3031 5.70037 7.4125 5.80977C7.52189 5.91917 7.58335 6.06754 7.58335 6.22225V10.1111C7.58134 10.2652 7.51923 10.4124 7.41027 10.5214C7.30131 10.6304 7.1541 10.6925 7.00002 10.6945Z",fill:"currentColor"},null,-1)])),16)}Z.render=Ne;var H={name:"TimesCircleIcon",extends:K};function Ze(e){return Ge(e)||Ve(e)||He(e)||Ue()}function Ue(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function He(e,t){if(e){if(typeof e=="string")return V(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?V(e,t):void 0}}function Ve(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function Ge(e){if(Array.isArray(e))return V(e)}function V(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,o=Array(t);n<t;n++)o[n]=e[n];return o}function Ke(e,t,n,o,i,r){return a(),c("svg",l({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},e.pti()),Ze(t[0]||(t[0]=[s("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M7 14C5.61553 14 4.26215 13.5895 3.11101 12.8203C1.95987 12.0511 1.06266 10.9579 0.532846 9.67879C0.00303296 8.3997 -0.13559 6.99224 0.134506 5.63437C0.404603 4.2765 1.07129 3.02922 2.05026 2.05026C3.02922 1.07129 4.2765 0.404603 5.63437 0.134506C6.99224 -0.13559 8.3997 0.00303296 9.67879 0.532846C10.9579 1.06266 12.0511 1.95987 12.8203 3.11101C13.5895 4.26215 14 5.61553 14 7C14 8.85652 13.2625 10.637 11.9497 11.9497C10.637 13.2625 8.85652 14 7 14ZM7 1.16667C5.84628 1.16667 4.71846 1.50879 3.75918 2.14976C2.79989 2.79074 2.05222 3.70178 1.61071 4.76768C1.16919 5.83358 1.05367 7.00647 1.27876 8.13803C1.50384 9.26958 2.05941 10.309 2.87521 11.1248C3.69102 11.9406 4.73042 12.4962 5.86198 12.7212C6.99353 12.9463 8.16642 12.8308 9.23232 12.3893C10.2982 11.9478 11.2093 11.2001 11.8502 10.2408C12.4912 9.28154 12.8333 8.15373 12.8333 7C12.8333 5.45291 12.2188 3.96918 11.1248 2.87521C10.0308 1.78125 8.5471 1.16667 7 1.16667ZM4.66662 9.91668C4.58998 9.91704 4.51404 9.90209 4.44325 9.87271C4.37246 9.84333 4.30826 9.8001 4.2544 9.74557C4.14516 9.6362 4.0838 9.48793 4.0838 9.33335C4.0838 9.17876 4.14516 9.0305 4.2544 8.92113L6.17553 7L4.25443 5.07891C4.15139 4.96832 4.09529 4.82207 4.09796 4.67094C4.10063 4.51982 4.16185 4.37563 4.26872 4.26876C4.3756 4.16188 4.51979 4.10066 4.67091 4.09799C4.82204 4.09532 4.96829 4.15142 5.07887 4.25446L6.99997 6.17556L8.92106 4.25446C9.03164 4.15142 9.1779 4.09532 9.32903 4.09799C9.48015 4.10066 9.62434 4.16188 9.73121 4.26876C9.83809 4.37563 9.89931 4.51982 9.90198 4.67094C9.90464 4.82207 9.84855 4.96832 9.74551 5.07891L7.82441 7L9.74554 8.92113C9.85478 9.0305 9.91614 9.17876 9.91614 9.33335C9.91614 9.48793 9.85478 9.6362 9.74554 9.74557C9.69168 9.8001 9.62748 9.84333 9.55669 9.87271C9.4859 9.90209 9.40996 9.91704 9.33332 9.91668C9.25668 9.91704 9.18073 9.90209 9.10995 9.87271C9.03916 9.84333 8.97495 9.8001 8.9211 9.74557L6.99997 7.82444L5.07884 9.74557C5.02499 9.8001 4.96078 9.84333 4.88999 9.87271C4.81921 9.90209 4.74326 9.91704 4.66662 9.91668Z",fill:"currentColor"},null,-1)])),16)}H.render=Ke;var We={name:"BaseToast",extends:W,props:{group:{type:String,default:null},position:{type:String,default:"top-right"},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},breakpoints:{type:Object,default:null},closeIcon:{type:String,default:void 0},infoIcon:{type:String,default:void 0},warnIcon:{type:String,default:void 0},errorIcon:{type:String,default:void 0},successIcon:{type:String,default:void 0},closeButtonProps:{type:null,default:null},onMouseEnter:{type:Function,default:void 0},onMouseLeave:{type:Function,default:void 0},onClick:{type:Function,default:void 0}},style:Ee,provide:function(){return{$pcToast:this,$parentInstance:this}}};function E(e){"@babel/helpers - typeof";return E=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},E(e)}function Ye(e,t,n){return(t=Xe(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Xe(e){var t=qe(e,"string");return E(t)=="symbol"?t:t+""}function qe(e,t){if(E(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(E(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}var se={name:"ToastMessage",hostName:"Toast",extends:W,emits:["close"],closeTimeout:null,createdAt:null,lifeRemaining:null,props:{message:{type:null,default:null},templates:{type:Object,default:null},closeIcon:{type:String,default:null},infoIcon:{type:String,default:null},warnIcon:{type:String,default:null},errorIcon:{type:String,default:null},successIcon:{type:String,default:null},closeButtonProps:{type:null,default:null},onMouseEnter:{type:Function,default:void 0},onMouseLeave:{type:Function,default:void 0},onClick:{type:Function,default:void 0}},mounted:function(){this.message.life&&(this.lifeRemaining=this.message.life,this.startTimeout())},beforeUnmount:function(){this.clearCloseTimeout()},methods:{startTimeout:function(){var t=this;this.createdAt=new Date().valueOf(),this.closeTimeout=setTimeout(function(){t.close({message:t.message,type:"life-end"})},this.lifeRemaining)},close:function(t){this.$emit("close",t)},onCloseClick:function(){this.clearCloseTimeout(),this.close({message:this.message,type:"close"})},clearCloseTimeout:function(){this.closeTimeout&&(clearTimeout(this.closeTimeout),this.closeTimeout=null)},onMessageClick:function(t){var n;(n=this.onClick)===null||n===void 0||n.call(this,{originalEvent:t,message:this.message})},handleMouseEnter:function(t){if(this.onMouseEnter){if(this.onMouseEnter({originalEvent:t,message:this.message}),t.defaultPrevented)return;this.message.life&&(this.lifeRemaining=this.createdAt+this.lifeRemaining-new Date().valueOf(),this.createdAt=null,this.clearCloseTimeout())}},handleMouseLeave:function(t){if(this.onMouseLeave){if(this.onMouseLeave({originalEvent:t,message:this.message}),t.defaultPrevented)return;this.message.life&&this.startTimeout()}}},computed:{iconComponent:function(){return{info:!this.infoIcon&&Z,success:!this.successIcon&&J,warn:!this.warnIcon&&F,error:!this.errorIcon&&H}[this.message.severity]},closeAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.close:void 0},dataP:function(){return re(Ye({},this.message.severity,this.message.severity))}},components:{TimesIcon:we,InfoCircleIcon:Z,CheckIcon:J,ExclamationTriangleIcon:F,TimesCircleIcon:H},directives:{ripple:Ce}};function T(e){"@babel/helpers - typeof";return T=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},T(e)}function Q(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),n.push.apply(n,o)}return n}function ee(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?Q(Object(n),!0).forEach(function(o){Je(e,o,n[o])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Q(Object(n)).forEach(function(o){Object.defineProperty(e,o,Object.getOwnPropertyDescriptor(n,o))})}return e}function Je(e,t,n){return(t=Qe(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Qe(e){var t=et(e,"string");return T(t)=="symbol"?t:t+""}function et(e,t){if(T(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(T(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}var tt=["data-p"],nt=["data-p"],ot=["data-p"],rt=["data-p"],st=["aria-label","data-p"];function at(e,t,n,o,i,r){var p=de("ripple");return a(),c("div",l({class:[e.cx("message"),n.message.styleClass],role:"alert","aria-live":"assertive","aria-atomic":"true","data-p":r.dataP},e.ptm("message"),{onClick:t[1]||(t[1]=function(){return r.onMessageClick&&r.onMessageClick.apply(r,arguments)}),onMouseenter:t[2]||(t[2]=function(){return r.handleMouseEnter&&r.handleMouseEnter.apply(r,arguments)}),onMouseleave:t[3]||(t[3]=function(){return r.handleMouseLeave&&r.handleMouseLeave.apply(r,arguments)})}),[n.templates.container?(a(),m(w(n.templates.container),{key:0,message:n.message,closeCallback:r.onCloseClick},null,8,["message","closeCallback"])):(a(),c("div",l({key:1,class:[e.cx("messageContent"),n.message.contentStyleClass]},e.ptm("messageContent")),[n.templates.message?(a(),m(w(n.templates.message),{key:1,message:n.message},null,8,["message"])):(a(),c(P,{key:0},[(a(),m(w(n.templates.messageicon?n.templates.messageicon:n.templates.icon?n.templates.icon:r.iconComponent&&r.iconComponent.name?r.iconComponent:"span"),l({class:e.cx("messageIcon")},e.ptm("messageIcon")),null,16,["class"])),s("div",l({class:e.cx("messageText"),"data-p":r.dataP},e.ptm("messageText")),[s("span",l({class:e.cx("summary"),"data-p":r.dataP},e.ptm("summary")),y(n.message.summary),17,ot),n.message.detail?(a(),c("div",l({key:0,class:e.cx("detail"),"data-p":r.dataP},e.ptm("detail")),y(n.message.detail),17,rt)):I("",!0)],16,nt)],64)),n.message.closable!==!1?(a(),c("div",fe(l({key:2},e.ptm("buttonContainer"))),[me((a(),c("button",l({class:e.cx("closeButton"),type:"button","aria-label":r.closeAriaLabel,onClick:t[0]||(t[0]=function(){return r.onCloseClick&&r.onCloseClick.apply(r,arguments)}),autofocus:"","data-p":r.dataP},ee(ee({},n.closeButtonProps),e.ptm("closeButton"))),[(a(),m(w(n.templates.closeicon||"TimesIcon"),l({class:[e.cx("closeIcon"),n.closeIcon]},e.ptm("closeIcon")),null,16,["class"]))],16,st)),[[p]])],16)):I("",!0)],16))],16,tt)}se.render=at;function O(e){"@babel/helpers - typeof";return O=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},O(e)}function it(e,t,n){return(t=lt(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function lt(e){var t=ct(e,"string");return O(t)=="symbol"?t:t+""}function ct(e,t){if(O(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(O(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function ut(e){return pt(e)||mt(e)||ft(e)||dt()}function dt(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ft(e,t){if(e){if(typeof e=="string")return G(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?G(e,t):void 0}}function mt(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function pt(e){if(Array.isArray(e))return G(e)}function G(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,o=Array(t);n<t;n++)o[n]=e[n];return o}var gt=0,ae={name:"Toast",extends:We,inheritAttrs:!1,emits:["close","life-end"],data:function(){return{messages:[]}},styleElement:null,mounted:function(){h.on("add",this.onAdd),h.on("remove",this.onRemove),h.on("remove-group",this.onRemoveGroup),h.on("remove-all-groups",this.onRemoveAllGroups),this.breakpoints&&this.createStyle()},beforeUnmount:function(){this.destroyStyle(),this.$refs.container&&this.autoZIndex&&z.clear(this.$refs.container),h.off("add",this.onAdd),h.off("remove",this.onRemove),h.off("remove-group",this.onRemoveGroup),h.off("remove-all-groups",this.onRemoveAllGroups)},methods:{add:function(t){t.id==null&&(t.id=gt++),this.messages=[].concat(ut(this.messages),[t])},remove:function(t){var n=this.messages.findIndex(function(o){return o.id===t.message.id});n!==-1&&(this.messages.splice(n,1),this.$emit(t.type,{message:t.message}))},onAdd:function(t){this.group==t.group&&this.add(t)},onRemove:function(t){this.remove({message:t,type:"close"})},onRemoveGroup:function(t){this.group===t&&(this.messages=[])},onRemoveAllGroups:function(){var t=this;this.messages.forEach(function(n){return t.$emit("close",{message:n})}),this.messages=[]},onEnter:function(){this.autoZIndex&&z.set("modal",this.$refs.container,this.baseZIndex||this.$primevue.config.zIndex.modal)},onLeave:function(){var t=this;this.$refs.container&&this.autoZIndex&&ue(this.messages)&&setTimeout(function(){z.clear(t.$refs.container)},200)},createStyle:function(){if(!this.styleElement&&!this.isUnstyled){var t;this.styleElement=document.createElement("style"),this.styleElement.type="text/css",ce(this.styleElement,"nonce",(t=this.$primevue)===null||t===void 0||(t=t.config)===null||t===void 0||(t=t.csp)===null||t===void 0?void 0:t.nonce),document.head.appendChild(this.styleElement);var n="";for(var o in this.breakpoints){var i="";for(var r in this.breakpoints[o])i+=r+":"+this.breakpoints[o][r]+"!important;";n+=`
                        @media screen and (max-width: `.concat(o,`) {
                            .p-toast[`).concat(this.$attrSelector,`] {
                                `).concat(i,`
                            }
                        }
                    `)}this.styleElement.innerHTML=n}},destroyStyle:function(){this.styleElement&&(document.head.removeChild(this.styleElement),this.styleElement=null)}},computed:{dataP:function(){return re(it({},this.position,this.position))}},components:{ToastMessage:se,Portal:ve}};function M(e){"@babel/helpers - typeof";return M=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},M(e)}function te(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),n.push.apply(n,o)}return n}function bt(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?te(Object(n),!0).forEach(function(o){yt(e,o,n[o])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):te(Object(n)).forEach(function(o){Object.defineProperty(e,o,Object.getOwnPropertyDescriptor(n,o))})}return e}function yt(e,t,n){return(t=ht(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function ht(e){var t=vt(e,"string");return M(t)=="symbol"?t:t+""}function vt(e,t){if(M(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(M(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}var Ct=["data-p"];function wt(e,t,n,o,i,r){var p=S("ToastMessage"),j=S("Portal");return a(),m(j,null,{default:C(function(){return[s("div",l({ref:"container",class:e.cx("root"),style:e.sx("root",!0,{position:e.position}),"data-p":r.dataP},e.ptmi("root")),[k(pe,l({name:"p-toast-message",tag:"div",onEnter:r.onEnter,onLeave:r.onLeave},bt({},e.ptm("transition"))),{default:C(function(){return[(a(!0),c(P,null,oe(i.messages,function(u){return a(),m(p,{key:u.id,message:u,templates:e.$slots,closeIcon:e.closeIcon,infoIcon:e.infoIcon,warnIcon:e.warnIcon,errorIcon:e.errorIcon,successIcon:e.successIcon,closeButtonProps:e.closeButtonProps,onMouseEnter:e.onMouseEnter,onMouseLeave:e.onMouseLeave,onClick:e.onClick,unstyled:e.unstyled,onClose:t[0]||(t[0]=function(g){return r.remove(g)}),pt:e.pt},null,8,["message","templates","closeIcon","infoIcon","warnIcon","errorIcon","successIcon","closeButtonProps","onMouseEnter","onMouseLeave","onClick","unstyled","pt"])}),128))]}),_:1},16,["onEnter","onLeave"])],16,Ct)]}),_:1})}ae.render=wt;var kt=`
    .p-confirmdialog .p-dialog-content {
        display: flex;
        align-items: center;
        gap: dt('confirmdialog.content.gap');
    }

    .p-confirmdialog-icon {
        color: dt('confirmdialog.icon.color');
        font-size: dt('confirmdialog.icon.size');
        width: dt('confirmdialog.icon.size');
        height: dt('confirmdialog.icon.size');
    }
`,It={root:"p-confirmdialog",icon:"p-confirmdialog-icon",message:"p-confirmdialog-message",pcRejectButton:"p-confirmdialog-reject-button",pcAcceptButton:"p-confirmdialog-accept-button"},St=ne.extend({name:"confirmdialog",style:kt,classes:It}),jt={name:"BaseConfirmDialog",extends:W,props:{group:String,breakpoints:{type:Object,default:null},draggable:{type:Boolean,default:!0}},style:St,provide:function(){return{$pcConfirmDialog:this,$parentInstance:this}}},ie={name:"ConfirmDialog",extends:jt,confirmListener:null,closeListener:null,data:function(){return{visible:!1,confirmation:null}},mounted:function(){var t=this;this.confirmListener=function(n){n&&n.group===t.group&&(t.confirmation=n,t.confirmation.onShow&&t.confirmation.onShow(),t.visible=!0)},this.closeListener=function(){t.visible=!1,t.confirmation=null},L.on("confirm",this.confirmListener),L.on("close",this.closeListener)},beforeUnmount:function(){L.off("confirm",this.confirmListener),L.off("close",this.closeListener)},methods:{accept:function(){this.confirmation.accept&&this.confirmation.accept(),this.visible=!1},reject:function(){this.confirmation.reject&&this.confirmation.reject(),this.visible=!1},onHide:function(){this.confirmation.onHide&&this.confirmation.onHide(),this.visible=!1}},computed:{appendTo:function(){return this.confirmation?this.confirmation.appendTo:"body"},target:function(){return this.confirmation?this.confirmation.target:null},modal:function(){return this.confirmation?this.confirmation.modal==null?!0:this.confirmation.modal:!0},header:function(){return this.confirmation?this.confirmation.header:null},message:function(){return this.confirmation?this.confirmation.message:null},blockScroll:function(){return this.confirmation?this.confirmation.blockScroll:!0},position:function(){return this.confirmation?this.confirmation.position:null},acceptLabel:function(){if(this.confirmation){var t,n=this.confirmation;return n.acceptLabel||((t=n.acceptProps)===null||t===void 0?void 0:t.label)||this.$primevue.config.locale.accept}return this.$primevue.config.locale.accept},rejectLabel:function(){if(this.confirmation){var t,n=this.confirmation;return n.rejectLabel||((t=n.rejectProps)===null||t===void 0?void 0:t.label)||this.$primevue.config.locale.reject}return this.$primevue.config.locale.reject},acceptIcon:function(){var t;return this.confirmation?this.confirmation.acceptIcon:(t=this.confirmation)!==null&&t!==void 0&&t.acceptProps?this.confirmation.acceptProps.icon:null},rejectIcon:function(){var t;return this.confirmation?this.confirmation.rejectIcon:(t=this.confirmation)!==null&&t!==void 0&&t.rejectProps?this.confirmation.rejectProps.icon:null},autoFocusAccept:function(){return this.confirmation.defaultFocus===void 0||this.confirmation.defaultFocus==="accept"},autoFocusReject:function(){return this.confirmation.defaultFocus==="reject"},closeOnEscape:function(){return this.confirmation?this.confirmation.closeOnEscape:!0}},components:{Dialog:Ie,Button:ke}};function At(e,t,n,o,i,r){var p=S("Button"),j=S("Dialog");return a(),m(j,{visible:i.visible,"onUpdate:visible":[t[2]||(t[2]=function(u){return i.visible=u}),r.onHide],role:"alertdialog",class:v(e.cx("root")),modal:r.modal,header:r.header,blockScroll:r.blockScroll,appendTo:r.appendTo,position:r.position,breakpoints:e.breakpoints,closeOnEscape:r.closeOnEscape,draggable:e.draggable,pt:e.pt,unstyled:e.unstyled},_({default:C(function(){return[e.$slots.container?I("",!0):(a(),c(P,{key:0},[e.$slots.message?(a(),m(w(e.$slots.message),{key:1,message:i.confirmation},null,8,["message"])):(a(),c(P,{key:0},[$(e.$slots,"icon",{},function(){return[e.$slots.icon?(a(),m(w(e.$slots.icon),{key:0,class:v(e.cx("icon"))},null,8,["class"])):i.confirmation.icon?(a(),c("span",l({key:1,class:[i.confirmation.icon,e.cx("icon")]},e.ptm("icon")),null,16)):I("",!0)]}),s("span",l({class:e.cx("message")},e.ptm("message")),y(r.message),17)],64))],64))]}),_:2},[e.$slots.container?{name:"container",fn:C(function(u){return[$(e.$slots,"container",{message:i.confirmation,closeCallback:u.closeCallback,acceptCallback:r.accept,rejectCallback:r.reject,initDragCallback:u.initDragCallback})]}),key:"0"}:void 0,e.$slots.container?void 0:{name:"footer",fn:C(function(){var u;return[k(p,l({class:[e.cx("pcRejectButton"),i.confirmation.rejectClass],autofocus:r.autoFocusReject,unstyled:e.unstyled,text:((u=i.confirmation.rejectProps)===null||u===void 0?void 0:u.text)||!1,onClick:t[0]||(t[0]=function(g){return r.reject()})},i.confirmation.rejectProps,{label:r.rejectLabel,pt:e.ptm("pcRejectButton")}),_({_:2},[r.rejectIcon||e.$slots.rejecticon?{name:"icon",fn:C(function(g){return[$(e.$slots,"rejecticon",{},function(){return[s("span",l({class:[r.rejectIcon,g.class]},e.ptm("pcRejectButton").icon,{"data-pc-section":"rejectbuttonicon"}),null,16)]})]}),key:"0"}:void 0]),1040,["class","autofocus","unstyled","text","label","pt"]),k(p,l({label:r.acceptLabel,class:[e.cx("pcAcceptButton"),i.confirmation.acceptClass],autofocus:r.autoFocusAccept,unstyled:e.unstyled,onClick:t[1]||(t[1]=function(g){return r.accept()})},i.confirmation.acceptProps,{pt:e.ptm("pcAcceptButton")}),_({_:2},[r.acceptIcon||e.$slots.accepticon?{name:"icon",fn:C(function(g){return[$(e.$slots,"accepticon",{},function(){return[s("span",l({class:[r.acceptIcon,g.class]},e.ptm("pcAcceptButton").icon,{"data-pc-section":"acceptbuttonicon"}),null,16)]})]}),key:"0"}:void 0]),1040,["label","class","autofocus","unstyled","pt"])]}),key:"1"}]),1032,["visible","class","modal","header","blockScroll","appendTo","position","breakpoints","closeOnEscape","draggable","onUpdate:visible","pt","unstyled"])}ie.render=At;const Pt={class:"flex h-screen overflow-hidden bg-gray-50"},xt={class:"h-14 flex items-center px-4 border-b border-gray-200 shrink-0"},Et={class:"flex-1 py-3 px-2 space-y-0.5 overflow-y-auto"},Tt={key:0,class:"absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-green-600 rounded-r"},Ot={class:"p-2 border-t border-gray-200 shrink-0"},Mt={class:"w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-mono font-medium text-gray-600 shrink-0"},Lt={class:"text-xs font-medium text-gray-700 truncate"},$t={class:"text-[10px] text-gray-400 font-mono"},Bt={class:"flex-1 flex flex-col overflow-hidden"},Dt={class:"h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0"},Rt={class:"flex items-center gap-3"},_t={class:"text-sm font-medium text-gray-900"},zt={key:0,class:"text-xs text-gray-400 font-mono"},Ft={class:"flex-1 overflow-y-auto"},Nt={class:"p-6 animate-fade-in"},Gt=ge({__name:"AppLayout",setup(e){const t=be(),n=he(),o=ye(!1),i=[{to:"/",label:"Dashboard",icon:"pi pi-objects-column",roles:["ADMIN","EMPLOYEE"]},{to:"/clients",label:"Klanten",icon:"pi pi-building",roles:["ADMIN","EMPLOYEE","FINANCE"]},{to:"/projects",label:"Projecten",icon:"pi pi-folder",roles:["ADMIN","EMPLOYEE"]},{to:"/invoices",label:"Facturen",icon:"pi pi-receipt",roles:["ADMIN","FINANCE"]},{to:"/proposals",label:"Offertes",icon:"pi pi-file-edit",roles:["ADMIN","EMPLOYEE"]},{to:"/finance",label:"Financieel",icon:"pi pi-chart-line",roles:["ADMIN","FINANCE"]},{to:"/settings",label:"Instellingen",icon:"pi pi-sliders-h",roles:["ADMIN"]}],r=B(()=>i.filter(f=>t.hasRole(...f.roles))),p={dashboard:["Dashboard"],clients:["Klanten","overzicht"],"client-detail":["Klant"],projects:["Projecten","overzicht"],"project-detail":["Project"],invoices:["Facturen","overzicht"],proposals:["Offertes","overzicht"],finance:["Financieel","overzicht"],settings:["Instellingen","beheer"]},j=B(()=>{var f;return((f=p[n.name])==null?void 0:f[0])||"AgencyOS"}),u=B(()=>{var f;return((f=p[n.name])==null?void 0:f[1])||""}),g=B(()=>{var d;return(((d=t.user)==null?void 0:d.name)||"").split(" ").map(R=>R[0]).join("").toUpperCase().slice(0,2)});function Y(f){return f==="/"?n.path==="/":n.path.startsWith(f)}return(f,d)=>{var X,q;const R=S("router-link"),le=S("router-view");return a(),c("div",Pt,[s("aside",{class:v(["group flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-out overflow-hidden shrink-0",o.value?"w-56":"w-16"]),onMouseenter:d[1]||(d[1]=b=>o.value=!0),onMouseleave:d[2]||(d[2]=b=>o.value=!1)},[s("div",xt,[d[3]||(d[3]=s("div",{class:"w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0"},[s("span",{class:"text-green-600 font-bold text-sm"},"A")],-1)),s("span",{class:v(["ml-3 text-sm font-semibold text-gray-900 whitespace-nowrap transition-opacity duration-200",o.value?"opacity-100":"opacity-0"])},"AgencyOS",2)]),s("nav",Et,[(a(!0),c(P,null,oe(r.value,b=>(a(),m(R,{key:b.to,to:b.to,class:v(["flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group/item relative",Y(b.to)?"bg-green-50 text-green-700":"text-gray-500 hover:text-gray-900 hover:bg-gray-100"])},{default:C(()=>[s("i",{class:v([b.icon,"text-[15px] w-5 text-center shrink-0"])},null,2),s("span",{class:v(["whitespace-nowrap transition-opacity duration-200",o.value?"opacity-100":"opacity-0 w-0"])},y(b.label),3),Y(b.to)?(a(),c("div",Tt)):I("",!0)]),_:2},1032,["to","class"]))),128))]),s("div",Ot,[s("div",{class:"flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer",onClick:d[0]||(d[0]=b=>A(t).logout())},[s("div",Mt,y(g.value),1),s("div",{class:v(["flex-1 min-w-0 transition-opacity duration-200",o.value?"opacity-100":"opacity-0 w-0"])},[s("p",Lt,y((X=A(t).user)==null?void 0:X.name),1),s("p",$t,y((q=A(t).user)==null?void 0:q.role),1)],2)])])],34),s("main",Bt,[s("header",Dt,[s("div",Rt,[s("h1",_t,y(j.value),1),u.value?(a(),c("span",zt,y(u.value),1)):I("",!0)]),d[4]||(d[4]=s("div",{class:"flex items-center gap-2"},[s("span",{class:"text-[10px] font-mono text-gray-400"},"v1.0")],-1))]),s("div",Ft,[s("div",Nt,[k(le)])])]),k(A(ae),{position:"bottom-right"}),k(A(ie))])}}});export{Gt as default};
