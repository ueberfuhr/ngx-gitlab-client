# Gitlab Client for Angular

This Gitlab Client provides Angular-based services to
call the [Gitlab REST API](https://docs.gitlab.com/ee/api/index.html).

## Configuration

We have to import the `GitlabClientModule` to make the services injectable.
For that, we need to define how to access Gitlab, i.e. which
host and security token to use.

### Static Gitlab Connection

We can easily configure the Gitlab connection with the following import:

```typescript
@NgModule({
  imports: [
    GitlabClientModule.forRoot({
      host: 'https://mygitlabhost/',
      token: 'mygitlabtoken'
    })
  ]
})
export class MyModule {
}
```

### Dynamic Gitlab Connection

If the Gitlab connection is calculated during runtime and provided by a custom service,
we can import the `GitlabClientModule` directly and then have to provide a `GITLAB_CONNECTION_PROVIDER`:

```typescript
@Injectable({providedIn: 'root'})
export class MyGitlabConfigService {

  readConfiguration(): GitlabConfig {
    // ...
  }

}

@NgModule({
  imports: [
    GitlabClientModule
  ],
  providers: [
    {
      provide: GITLAB_CONFIG_PROVIDER,
      useFactory: (service: MyGitlabConfigService) => () => service.readConfiguration(),
      deps: [MyGitlabConfigService],
    }
  ]
})
export class MyModule {
}
```

## Gitlab Service - Basic API Calls

`GitlabService` is a common service without any relation to a special REST resource.
We can use it, when we

- want to access a resource that is not provided by any of the other services
- want to get notified whenever a REST call was made (or an error occurred)

### Simple calls

Calls to Gitlab are made using the Angular `HttpClient`. To invoke a simple get request
(using the configured Gitlab connection configuration), we can use

```typescript
  gitlab
    .call<MyCommitType>('projects/5/repository/commits')
    .subscribe(commit => {
        // ...
    })
```

We can also provide the HTTP method and some other options like additional headers:

```typescript
  gitlab
    .call<MyCommitResult>('projects/5/repository/commits', 'post', {
        body: myNewCommit,
        headers: {
            myHeaderName: myHeaderValue
        }
    })
    .subscribe(result => {
        // ...
    })
```

### Paginated calls

For big data, Gitlab uses pagination. `GitlabService` is able to handle it
and provides lazy loading, i.e. it only calls the API when we need to read the data.

We can simply use

```typescript
  gitlab
    .callPaginated<MyType>('projects/5/repository/commits')
    .pipe(take(10)) // only read the first 10 entries, then skip
    .subscribe(dataset => {
      let myObj = dataset.payload;
      let index = dataset.index;
      let total = dataset.total;
      // ...
    })
```

We have to be aware that the default page size is 20, so those 20 entries are read out with a single request.
If we already know the count of entries we want to read, we could also specify a different page size:

```typescript
  gitlab
    .callPaginated<MyType>('projects/5/repository/commits', null, 10)
```

### Notifications for Gitlab calls

We can get notified when a call to Gitlab is made or when an error occurred.
E.g., this allows to provide a kind of component to display the current connection status:

```typescript
export class GitlabConnectionStatusComponent implements OnInit, OnDestroy {

  private accesses?: Subscription;
  private errors?: Subscription;

  constructor(private readonly gitlab: GitlabService) {
  }

  ngOnInit(): void {
    this.accesses = this.gitlab.accesses.subscribe(access => {
      // ... (access is type of GitlabAccess)
    });
    this.errors = this.gitlab.errors.subscribe(err => {
      // ... (err is type of GitlabAccessError)
    });
  }

  ngOnDestroy(): void {
    this.accesses?.unsubscribe();
    this.errors?.unsubscribe()
  }
}
```
