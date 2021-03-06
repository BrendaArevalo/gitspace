import React, {Component} from 'react';
import Chart from "./Chart";

class Form extends Component {

    constructor(props) {
        super(props)

        this.state = {
            username: "",
            renderChart: true,
            responseData: [],
            chartData: null,
            repos: null,
            loading: false,
            success:false,
            sizeMessage:false,
            fetchPage: 1,
            fetchMore: true,
            invalidUser: false,
            noRepos: false,
            unknownError: false,
            totalSize: 0
        }
        this.initPageState()
    }

    handleUsernameChange = (event) => {
        this.setState({
            username: event.target.value
        })
    }

    async fetchRepos() {
        if (!this.fetchMore) {
            return
        }
        const url = `https://api.github.com/users/${this.state.username}/repos?per_page=100`
        const url_with_pagination = `${url}&page=${this.fetchPage}`
        const response = await fetch(url_with_pagination)
        const responseData = await response.json()

        if (response.status === 404) {
            this.invalidUser = true
            return
        }

        if (response.status !== 200) {
            this.unknownError = true
            this.loading = false
            this.success = false
            return
        }

        if (responseData.length === 0) {
            this.fetchMore = false
            this.loading = false
            this.success = false

            if (this.responseData.length === 0) {
                this.noRepos = true
            }
            return
        }

        this.responseData = this.responseData.concat(responseData)
        this.fetchPage = this.fetchPage + 1
        await this.fetchRepos()
    }

    initPageState = () => {
        this.responseData = []
        this.fetchPage = 1
        this.fetchMore = true
        this.invalidUser = false
        this.noRepos = false
        this.unknownError = false
        this.success = false
    }

    handleSubmit = (event) => {
        this.setState({
            loading: true,
            invalidUser: false,
            noRepos: false,
            unknownError: false,
            sizeMessage: false
        });
        event.preventDefault()

        this.fetchRepos().then(() => {
            if (this.responseData.length !== 0) {
                this.formatResponseData()
            } else {
                this.setState({
                    success: false,
                    sizeMessage: false,
                    invalidUser: this.invalidUser,
                    unknownError: this.unknownError,
                    noRepos: this.noRepos
                })
            }
            this.initPageState()
            this.setState({ loading: false });
        })

    }

    formatResponseData() {
        let chartData = [];
        let repos = []
        let totalSize = 0
        this.responseData.forEach(element => {
            repos.push(element.name)
            totalSize += element.size
            let repoSize = element.size
            chartData.push({
                "repoName": element.name,
                "size": repoSize,
            })
        });

        chartData.sort(function(a, b) {
            return a.size - b.size;
        });

        this.setState({
            chartData: chartData,
            repos: repos,
            totalSize: Math.round((totalSize / (1024*1024) + Number.EPSILON) * 100) / 100,
            success: true,
            sizeMessage: true,
            invalidUser: false,
            unknownError: false,
            noRepos: false
        })
    }


    render() {
        return (
            <div>
            <form onSubmit={this.handleSubmit} className="username-input-form">
                <input type="text" className="username-input" placeholder="Github Username" value={this.state.username}
                       onChange={this.handleUsernameChange}/>
            </form>
                {this.state.loading?
                    <div className="spinner-border" role="status">
                    </div> : null
                }
                {this.state.invalidUser?
                    <div className="alert alert-warning message" role="alert">
                        You sure that's a Github username?
                    </div> : null
                }
                {this.state.noRepos?
                    <div className="alert alert-warning message" role="alert">
                        This person doesn't seems to have any repositories, what are you trying to see the space for?
                    </div> : null
                }
                {this.state.unknownError?
                    <div className="alert alert-danger message" role="alert">
                        Something went wrong!
                    </div> : null
                }
                {this.state.sizeMessage ?
                    <div className="alert alert-info message">Total space occupied: {this.state.totalSize} GiB</div> : null
                }
                {this.state.success ?
                    <Chart data={this.state.chartData} repos={this.state.repos}/> : null
                }

            </div>
        );
    }

}

export default Form;
