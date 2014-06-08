using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Http;
using TestReport.BLL;
using TestReport.DAL;
using System.Configuration;
using System.Data;
using System.Text;
using System.Net.Http;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using System.Drawing;
using System.IO;

namespace TestReport.API.Controllers
{


    public class ReportController : ApiController
    {
        private string cnStr;// = ConfigurationManager.ConnectionStrings["ReportConnection"].ConnectionString;
        private SqlDataAccess da;// = new SqlDataAccess(cnStr);
        private ReportData rd;// = new ReportData(da);

        //
        // GET: /Report/
        public ReportController()
        {
            cnStr = ConfigurationManager.ConnectionStrings["ReportConnection"].ConnectionString;
            da = new SqlDataAccess(cnStr);
            rd = new ReportData(da);
        }
        
        /// <summary>
        /// Get:api/getproject
        /// </summary>
        /// <param name="email"></param>
        /// <returns></returns>
        public DataTable GetProject(string email)
        {
            DataTable dt = rd.GetProjects(email);
            return dt;
        }

        public DataTable GetOptions(string project)
        {
            DataTable dt = rd.GetProjectOptions(project);
            return dt;
        }

        public DataTable GetCount(string pj, string c,string t, DateTime st, DateTime et)
        {
            DataTable dt = rd.GetCount(pj, c, t, st, et);
            return dt;
        }

        public DataTable GetPivot(string pj, string r, string c, DateTime st, DateTime et)
        {
            DataTable dt = rd.GetPivotTable(pj, r, c, st, et);
            return dt;
        }

        public DataTable GetSummary(string pj, DateTime st, DateTime et)
        {
            DataTable dt = rd.GetDefectSummary(pj, st, et);
            return dt;
        }

        public HttpResponseMessage GetImage(IMageType t)
        {
            string path = AppDomain.CurrentDomain.BaseDirectory + @"images\";
            switch (t)
            {
                case IMageType.smile:
                    path += "smile";
                    break;
                case IMageType.sad:
                    path+="sad";
                    break;
                case IMageType.normal:
                    path+="normal";
                    break;
                default:
                    path = null;
                    break;
            }
            if (path != null)
            {
                Image img = Image.FromFile(getFilePath(path));
                MemoryStream ms = new MemoryStream();
                img.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
                HttpResponseMessage result = new HttpResponseMessage(System.Net.HttpStatusCode.OK);
                result.Content = new ByteArrayContent(ms.ToArray());
                result.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
                return result;
            }
            return null;
        }

        private string getFilePath(string path)
        {
            DirectoryInfo di = new DirectoryInfo(path);
            FileInfo[] files = di.GetFiles();
            Random rd = new Random();
            return files[rd.Next(files.Count() - 1)].FullName;
        }
        
    }

    public enum IMageType
    {
        smile,
        sad,
        normal
    }

    
}
