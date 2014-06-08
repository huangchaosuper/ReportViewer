using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace TestReport.API.Filters
{
    public class AllowCrossSiteJsonAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            actionContext.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            actionContext.Request.Headers.Add("Access-Control-Allow-Origin", "*");
            base.OnActionExecuting(actionContext);
        }
    }
}