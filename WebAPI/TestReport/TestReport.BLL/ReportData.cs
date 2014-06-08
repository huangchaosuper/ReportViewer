using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TestReport.DAL;
using System.Data;
using System.Data.SqlClient;

namespace TestReport.BLL
{
    public class ReportData
    {
        private DataAccessBase _dab;

        public ReportData(DataAccessBase dab)
        {
            this._dab = dab;
        }

        public DataTable GetProjects(string email)
        {
            SqlParameter param = new SqlParameter();
            param.ParameterName = "@Email";
            param.Value = email;
            DataTable dt = _dab.GetDataTable("GetProjects", CommandType.StoredProcedure, new List<System.Data.Common.DbParameter>() { param });
            return dt;
        }

        public DataTable GetProjectOptions(string project)
        {
            SqlParameter param = new SqlParameter();
            param.ParameterName = "@Project";
            param.Value = project;
            DataTable dt = _dab.GetDataTable("GetProjectOptions", CommandType.StoredProcedure, new List<System.Data.Common.DbParameter>() { param });
            return dt;
        }

        
        public DataTable GetDailyDefects(string project)
        {
            SqlParameter param = new SqlParameter();
            param.ParameterName = "@Project";
            param.Value = project;
            DataTable dt = _dab.GetDataTable("GetDailyDefects", CommandType.StoredProcedure, new List<System.Data.Common.DbParameter>() { param });
            return dt;
        }

        public DataTable GetCount(string project, string colOption, DateTime startDate, DateTime endDate)
        {
            List<System.Data.Common.DbParameter> parameters = new List<System.Data.Common.DbParameter>();
            SqlParameter param = new SqlParameter();
            param.ParameterName = "@Project";
            param.Value = project;
            parameters.Add(param);
            param = new SqlParameter();
            param.ParameterName = "@colName";
            param.Value = colOption;
            parameters.Add(param);
            param = new SqlParameter();
            param.ParameterName = "@startDate";
            param.Value = startDate;
            parameters.Add(param);
            param = new SqlParameter();
            param.ParameterName = "@EndDate";
            param.Value = endDate;
            parameters.Add(param);
            DataTable dt = _dab.GetDataTable("GetDefectCount", CommandType.StoredProcedure, parameters);
            return dt;
        }

        public DataTable GetPivotTable(string project, string rowOption, string colOption, DateTime startDate, DateTime endDate)
        {
            List<System.Data.Common.DbParameter> parameters = new List<System.Data.Common.DbParameter>();
            SqlParameter param = new SqlParameter();
            param.ParameterName = "@ProjectName";
            param.Value = project;
            parameters.Add(param);
            param = new SqlParameter();
            param.ParameterName = "@rowName";
            param.Value = rowOption;
            parameters.Add(param);
            param = new SqlParameter();
            param.ParameterName = "@colName";
            param.Value = colOption;
            parameters.Add(param);
            param = new SqlParameter();
            param.ParameterName = "@startDate";
            param.Value = startDate;
            parameters.Add(param);
            param = new SqlParameter();
            param.ParameterName = "@EndDate";
            param.Value = endDate;
            parameters.Add(param);
            DataTable dt = _dab.GetDataTable("GetPivotTable", CommandType.StoredProcedure, parameters);
            return dt;
        }
    }
}
